const Order = require('../models/Order');

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
    const { items, total, status } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }
    if (typeof total !== 'number') {
      return res.status(400).json({ success: false, message: 'Total must be a number' });
    }

    const normalizedItems = items.map((i) => ({
      product: i.productId || i.product || (i.product && i.product._id),
      name: i.name || (i.product && i.product.name) || '',
      price: i.price ?? (i.product && (i.product.salePrice > 0 ? i.product.salePrice : i.product.retailPrice)) ?? 0,
      quantity: i.quantity || 1,
      image: i.image || (i.product && i.product.images && (i.product.images[0]?.url || i.product.images[0])) || ''
    }));

    const order = await Order.create({
      user: req.user._id,
      items: normalizedItems,
      total,
      status: status || 'Processing',
      orderedAt: new Date(),
    });

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

// Update order status to Packing
exports.updateOrderToPacking = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'Processing') {
      return res.status(400).json({ success: false, message: 'Order must be in Processing status to update to Packing' });
    }

    order.status = 'Packing';
    order.statusHistory.push({
      status: 'Packing',
      updatedBy: req.user ? req.user._id : null, // Make updatedBy optional for now
      updatedAt: new Date(),
    });

    await order.save();

    res.status(200).json({ success: true, message: 'Order status updated to Packing', order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order status', error: err.message });
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

    const order = await Order.findById(orderId);
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

    const order = await Order.findById(orderId);
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