const Order = require('../models/Order');
const Product = require('../models/Product');
const OrderSummary = require('../models/OrderSummary');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const { createOrderStatusNotification } = require('./notificationController');
const mongoose = require('mongoose');

// Get order history for logged-in user
exports.getUserOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name images salePrice retailPrice')
      .sort({ orderedAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order history', error: err.message });
  }
};

// Create order (after successful payment)
exports.createOrder = async (req, res) => {
  try {
    const { items, total, status, subtotal, shippingCost } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }
    if (typeof total !== 'number') {
      return res.status(400).json({ success: false, message: 'Total must be a number' });
    }

    const normalizedItems = items.map((i) => {
      const item = {
        product: i.productId || i.product || (i.product && i.product._id),
        name: i.name || (i.product && i.product.name) || '',
        price: i.price ?? (i.product && (i.product.salePrice > 0 ? i.product.salePrice : i.product.retailPrice)) ?? 0,
        quantity: i.quantity || 1,
        image: i.image || (i.product && i.product.images && (i.product.images[0]?.url || i.product.images[0])) || ''
      };
      
      // Add customization data if present
      if (i.customization) {
        item.customization = i.customization;
      }
      
      return item;
    });

    // Calculate subtotal if not provided
    const calculatedSubtotal = subtotal || normalizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculatedShippingCost = shippingCost !== undefined ? shippingCost : (calculatedSubtotal > 0 ? 10 : 0);

    const order = await Order.create({
      user: req.user._id,
      items: normalizedItems,
      subtotal: calculatedSubtotal,
      shippingCost: calculatedShippingCost,
      total,
      status: status || 'Pending',
      orderedAt: new Date(),
    });

    // Update customization statuses if present
    for (const item of normalizedItems) {
      if (item.customization && item.customization.id) {
        try {
          const Customization = require('../models/Customization');
          await Customization.findByIdAndUpdate(
            item.customization.id,
            { 
              status: 'confirmed',
              order: order._id
            }
          );
        } catch (error) {
          console.error('Error updating customization status:', error);
          // Don't fail the main operation
        }
      }
    }

    // Create notification for order creation
    try {
      await createOrderStatusNotification(
        req.user._id,
        order._id,
        'pending',
        req.user?.email,
        `${req.user?.firstName} ${req.user?.lastName}`.trim(),
        req
      );
    } catch (notificationError) {
      console.error('Error creating notification for order creation:', notificationError);
      // Don't fail the main operation if notification fails
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create order', error: err.message });
  }
};

// Get all orders for admin
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product', 'name images salePrice retailPrice')
      .populate('user', 'firstName lastName email phone address') // Include firstName and lastName in user details
      .sort({ orderedAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch all orders', error: err.message });
  }
};

// Accept order - Update from Pending to Processing
exports.acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if order is in Pending status
    if (order.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Order must be in Pending status to accept' });
    }

    // Update order status to Processing
    order.status = 'Processing';
    order.updatedBy = req.user._id;
    
    // Add to status history
    order.statusHistory.push({
      status: 'Processing',
      updatedBy: req.user._id,
      updatedAt: new Date(),
      notes: 'Order accepted by admin'
    });

    await order.save();

    // Create notification and send email
    try {
      await createOrderStatusNotification(
        order.user._id,
        order._id,
        'processing',
        order.user?.email,
        order.user?.name || `${order.user?.firstName} ${order.user?.lastName}`.trim(),
        req
      );
    } catch (notificationError) {
      console.error('Error creating notification for order acceptance:', notificationError);
      // Don't fail the main operation if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Order accepted successfully',
      order: order
    });

  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update order status to Packing with stock management and order summary creation
exports.updateOrderToPacking = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();
    
    const { orderId } = req.body;

    if (!orderId) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    // Find the order and populate items with product details
    const order = await Order.findById(orderId)
      .populate('user', 'email firstName lastName')
      .populate('items.product', 'name sku stock costPrice retailPrice salePrice')
      .session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'Processing') {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Order must be in Processing status to update to Packing' 
      });
    }

    // Validate stock for all items first
    const stockValidationErrors = [];
    const stockUpdates = [];
    const orderSummaryEntries = [];

    for (const item of order.items) {
      if (!item.product) {
        stockValidationErrors.push(`Product not found for item: ${item.name}`);
        continue;
      }

      const product = item.product;
      const requestedQuantity = item.quantity;
      const availableStock = product.stock || 0;

      if (availableStock < requestedQuantity) {
        stockValidationErrors.push(`Insufficient stock for product: ${product.name}. Requested: ${requestedQuantity}, Available: ${availableStock}`);
      } else {
        // Prepare stock update
        stockUpdates.push({
          productId: product._id,
          newStock: availableStock - requestedQuantity,
          quantity: requestedQuantity
        });

        // Prepare order summary entry
        const salePrice = product.salePrice > 0 ? product.salePrice : product.retailPrice;
        const profit = salePrice - product.costPrice;
        const totalProfit = profit * requestedQuantity;

        orderSummaryEntries.push({
          giftId: orderId, // Using order ID as gift ID for regular orders
          productSKU: product.sku,
          productId: product._id,
          productName: product.name,
          quantity: requestedQuantity,
          costPrice: product.costPrice,
          retailPrice: product.retailPrice,
          salePrice: salePrice,
          profit: profit,
          totalProfit: totalProfit,
          orderDate: order.orderedAt,
          status: 'orders'
        });
      }
    }

    // If there are stock validation errors, abort the transaction
    if (stockValidationErrors.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Stock validation failed',
        errors: stockValidationErrors
      });
    }

    // Update product stock
    for (const update of stockUpdates) {
      await Product.findByIdAndUpdate(
        update.productId,
        { 
          $inc: { stock: -update.quantity },
          $set: { 
            stockStatus: update.newStock <= 0 ? 'out-of-stock' : 
                        update.newStock <= 5 ? 'low-stock' : 'in-stock'
          }
        },
        { session }
      );
    }

    // Create order summary entries
    if (orderSummaryEntries.length > 0) {
      await OrderSummary.insertMany(orderSummaryEntries, { session });
    }

    // Update order status
    order.status = 'Packing';
    order.statusHistory.push({
      status: 'Packing',
      updatedBy: req.user ? req.user._id : null,
      updatedAt: new Date(),
      notes: `Stock reduced and order summary created for ${order.items.length} products`
    });

    await order.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    // Create notification and send email (outside transaction)
    try {
      await createOrderStatusNotification(
        order.user._id,
        order._id,
        'packing',
        order.user?.email,
        order.user?.name || `${order.user?.firstName} ${order.user?.lastName}`.trim(),
        req
      );
    } catch (notificationError) {
      console.error('Error creating notification for packing update:', notificationError);
      // Don't fail the main operation if notification fails
    }

    res.status(200).json({ 
      success: true, 
      message: `Order moved to Packing. Stock reduced for ${stockUpdates.length} products and order summary created.`,
      order: {
        id: order._id,
        status: order.status,
        stockUpdatesCount: stockUpdates.length,
        orderSummaryEntriesCount: orderSummaryEntries.length
      }
    });

  } catch (err) {
    await session.abortTransaction();
    console.error('Error in updateOrderToPacking:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update order to packing status', 
      error: err.message 
    });
  } finally {
    session.endSession();
  }
};

// Update order status to Shipped
exports.updateOrderToShipped = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    const { orderId } = req.body;

    if (!orderId) {
      console.log('Order ID is missing'); // Debug log
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('user', 'email firstName lastName');
    console.log('Found order:', order ? `ID: ${order._id}, Status: ${order.status}` : 'null'); // Debug log

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'Packing') {
      console.log(`Order status validation failed. Current status: ${order.status}, Expected: Packing`); // Debug log
      return res.status(400).json({ success: false, message: `Order must be in Packing status to update to Shipped. Current status: ${order.status}` });
    }

    order.status = 'Shipped';
    order.statusHistory.push({
      status: 'Shipped',
      updatedBy: req.user ? req.user._id : null,
      updatedAt: new Date(),
    });

    await order.save();

    // Create notification and send email
    try {
      await createOrderStatusNotification(
        order.user._id,
        order._id,
        'shipped',
        order.user?.email,
        order.user?.name || `${order.user?.firstName} ${order.user?.lastName}`.trim(),
        req
      );
    } catch (notificationError) {
      console.error('Error creating notification for shipped update:', notificationError);
      // Don't fail the main operation if notification fails
    }

    res.status(200).json({ success: true, message: 'Order status updated to Shipped', order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order status', error: err.message });
  }
};

// Update order status to Delivered
exports.updateOrderToDelivered = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    const { orderId } = req.body;

    if (!orderId) {
      console.log('Order ID is missing'); // Debug log
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('user', 'email firstName lastName');
    console.log('Found order:', order ? `ID: ${order._id}, Status: ${order.status}` : 'null'); // Debug log

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'Shipped') {
      console.log(`Order status validation failed. Current status: ${order.status}, Expected: Shipped`); // Debug log
      return res.status(400).json({ success: false, message: `Order must be in Shipped status to update to Delivered. Current status: ${order.status}` });
    }

    order.status = 'Delivered';
    order.statusHistory.push({
      status: 'Delivered',
      updatedBy: req.user ? req.user._id : null,
      updatedAt: new Date(),
    });

    await order.save();

    // Create notification and send email
    try {
      await createOrderStatusNotification(
        order.user._id,
        order._id,
        'delivered',
        order.user?.email,
        order.user?.name || `${order.user?.firstName} ${order.user?.lastName}`.trim(),
        req
      );
    } catch (notificationError) {
      console.error('Error creating notification for delivered update:', notificationError);
      // Don't fail the main operation if notification fails
    }

    res.status(200).json({ success: true, message: 'Order status updated to Delivered', order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order status', error: err.message });
  }
};

// Delete order (only if not yet shipped)
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if the order belongs to the requesting user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own orders' });
    }

    // Only allow deletion if order is not yet shipped or delivered
    if (order.status === 'Shipped' || order.status === 'Delivered') {
      return res.status(400).json({ success: false, message: 'Cannot delete orders that have been shipped or delivered' });
    }

    await Order.findByIdAndDelete(orderId);

    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete order', error: err.message });
  }
};