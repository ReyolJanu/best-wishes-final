const SurpriseGift = require('../models/SurpriseGift');
const Product = require('../models/Product');
const OrderSummary = require('../models/OrderSummary');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { sendEmail } = require('../config/emailConfig');

exports.createSurpriseGift = async (req, res) => {
  try {
    const { recipientName, recipientPhone, shippingAddress, costume = 'none', suggestions = '', items, total, scheduledAt } = req.body;
    if (!recipientName || !recipientPhone || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }
    if (typeof total !== 'number') {
      return res.status(400).json({ success: false, message: 'Total must be a number' });
    }

    const normalizedItems = items.map(i => ({
      product: i.productId || i.product,
      name: i.name,
      price: i.price,
      quantity: i.quantity || 1,
      image: i.image || '',
    }));

    const doc = await SurpriseGift.create({
      user: req.user._id,
      recipientName,
      recipientPhone,
      shippingAddress,
      costume,
      suggestions,
      items: normalizedItems,
      total,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create surprise gift', error: err.message });
  }
};

exports.getMySurpriseGifts = async (req, res) => {
  try {
    const docs = await SurpriseGift.find({ user: req.user._id })
      .populate('items.product', 'name images retailPrice salePrice')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch surprise gifts', error: err.message });
  }
};

// Admin functions
exports.getAllSurpriseGifts = async (req, res) => {
  try {
    const { tab } = req.query;
    
    // Build query based on tab
    let query = {};
    
    switch (tab) {
      case 'Processing':
        query.status = 'Pending';
        break;
      case 'Packing':
        query.status = 'Packing';
        break;
      case 'DeliveryConfirmed':
        query.status = 'OutForDelivery';
        break;
      case 'AllOrders':
        query.status = 'Delivered';
        break;
      default:
        // If no tab specified, return all orders
        break;
    }
    
    const docs = await SurpriseGift.find(query)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images retailPrice salePrice')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      data: docs,
      count: docs.length 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch surprise gifts', 
      error: err.message 
    });
  }
};

exports.startPackingSurpriseGift = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    // Find the surprise gift
    const surpriseGift = await SurpriseGift.findById(id).session(session);
    
    if (!surpriseGift) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Surprise gift not found'
      });
    }

    // Check if the order is in Pending status
    if (surpriseGift.status !== 'Pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot start packing. Order status is '${surpriseGift.status}'. Expected 'Pending'`
      });
    }

    // Check stock and prepare data for order summaries
    const insufficientStockItems = [];
    const orderSummaryData = [];
    let totalProfit = 0;

    for (const item of surpriseGift.items) {
      const product = await Product.findById(item.product).session(session);
      
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.name}`
        });
      }

      // Check if sufficient stock is available
      if (product.stock < item.quantity) {
        insufficientStockItems.push({
          productName: product.name,
          requestedQuantity: item.quantity,
          availableStock: product.stock
        });
      }

      // Calculate profit (assuming costPrice exists on product, otherwise use retailPrice as cost)
      const costPrice = product.costPrice || product.retailPrice * 0.7; // 30% margin if no cost price
      const profit = (product.salePrice - costPrice) * item.quantity;
      totalProfit += profit;

      orderSummaryData.push({
        giftId: surpriseGift._id,
        productSKU: product.sku || product._id.toString(),
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        costPrice: costPrice,
        retailPrice: product.retailPrice,
        salePrice: product.salePrice,
        profit: profit,
        totalProfit: profit,
        orderDate: new Date(),
        status: "surprisegift"
      });
    }

    // If any items have insufficient stock, return error
    if (insufficientStockItems.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for some items',
        data: {
          insufficientStockItems
        }
      });
    }

    // Reduce stock for all products
    for (const item of surpriseGift.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // Create order summary records
    await OrderSummary.insertMany(orderSummaryData, { session });

    // Update surprise gift status to Packing
    await SurpriseGift.findByIdAndUpdate(
      id,
      { 
        status: 'Packing',
        packedAt: new Date()
      },
      { session }
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Packing started successfully',
      data: {
        totalProfit,
        itemsProcessed: orderSummaryData.length
      }
    });

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'Failed to start packing process',
      error: err.message
    });
  } finally {
    await session.endSession();
  }
};

exports.getSurpriseGiftById = async (req, res) => {
  try {
    const doc = await SurpriseGift.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images retailPrice salePrice');
    
    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        message: 'Surprise gift not found' 
      });
    }
    
    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch surprise gift', 
      error: err.message 
    });
  }
};

exports.cancelSurpriseGift = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the surprise gift
    const surpriseGift = await SurpriseGift.findById(id);
    
    if (!surpriseGift) {
      return res.status(404).json({
        success: false,
        message: 'Surprise gift not found'
      });
    }

    // Only allow cancellation if status is Pending
    if (surpriseGift.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order. Current status is '${surpriseGift.status}'. Only orders with 'Pending' status can be cancelled.`
      });
    }

    // Update status to Cancelled
    const updatedGift = await SurpriseGift.findByIdAndUpdate(
      id,
      { 
        status: 'Cancelled',
        cancelledAt: new Date()
      },
      { new: true }
    ).populate('user', 'firstName lastName email phone');

    // Create notification for user
    try {
      await Notification.create({
        user: updatedGift.user._id,
        title: 'Surprise Gift Cancelled',
        message: `Your surprise gift order for ${updatedGift.recipientName} has been cancelled.`,
        type: 'order',
        relatedId: updatedGift._id
      });
    } catch (notifError) {
      console.error('Error creating cancellation notification:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Surprise gift cancelled successfully',
      data: updatedGift
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel surprise gift',
      error: err.message
    });
  }
};

exports.updateSurpriseGiftStatus = async (req, res) => {
  try {

    const { status, scheduledAt, deliveryStaffId } = req.body;

    const { id } = req.params;
    
    const validStatuses = ['Pending','Confirmed','AwaitingPayment','Paid','Packing','OutForDelivery','Delivered','Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ') 
      });
    }

    // Check payment status for certain status transitions
    if (status === 'OutForDelivery') {
      const currentGift = await SurpriseGift.findById(id);
      if (!currentGift) {
        return res.status(404).json({
          success: false,
          message: 'Surprise gift not found'
        });
      }

      // Allow transition from Packing to OutForDelivery (payment was validated during packing)
      if (currentGift.status !== 'Packing' && currentGift.paymentStatus !== 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Cannot ship order - payment not completed. User must pay first.'
        });
      }
    }

    const updateData = { status };
    if (scheduledAt) {
      updateData.scheduledAt = new Date(scheduledAt);
    }
    

    // Add delivery staff ID when marking as delivered
    if (status === 'Delivered' && deliveryStaffId) {
      updateData.deliveryStaffId = deliveryStaffId;
      updateData.deliveredAt = new Date();

    }

    const doc = await SurpriseGift.findByIdAndUpdate(
      id, 
      updateData,
      { new: true }
    ).populate('user', 'firstName lastName email phone');

    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        message: 'Surprise gift not found' 
      });
    }

    // Create notification for user
    try {
      let notificationMessage = `Your surprise gift for ${doc.recipientName} status has been updated to ${doc.status}.`;

      await Notification.create({
        user: doc.user._id,
        title: 'Surprise Gift Update',
        message: notificationMessage,
        type: 'order',
        relatedId: doc._id
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    // Send email notification
    try {
      const statusMessages = {
        'AwaitingPayment': `Your surprise gift for ${doc.recipientName} has been confirmed! Please complete your payment of $${doc.total.toFixed(2)} to proceed with delivery.`,
        'Paid': `Payment received! Your surprise gift for ${doc.recipientName} will be processed and delivered soon.`,
        'Packing': `Your surprise gift for ${doc.recipientName} is now being packed and prepared for delivery.`,
        'OutForDelivery': `Your surprise gift for ${doc.recipientName} is now out for delivery!`,
        'Delivered': `Your surprise gift for ${doc.recipientName} has been successfully delivered.`,
        'Cancelled': `Your surprise gift for ${doc.recipientName} has been cancelled.`
      };

      if (statusMessages[doc.status]) {
        await sendEmail({
          to: doc.user.email,
          subject: `Surprise Gift ${doc.status} - Best Wishes`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #822BE2;">Surprise Gift Update</h2>
              <p>Dear ${doc.user.firstName || 'Customer'},</p>
              <p>${statusMessages[doc.status]}</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Order Details:</h3>
                <p><strong>Recipient:</strong> ${doc.recipientName}</p>
                <p><strong>Phone:</strong> ${doc.recipientPhone}</p>
                <p><strong>Address:</strong> ${doc.shippingAddress}</p>
                <p><strong>Total:</strong> $${doc.total.toFixed(2)}</p>
                <p><strong>Payment Status:</strong> ${doc.paymentStatus}</p>
                ${doc.scheduledAt ? `<p><strong>Scheduled At:</strong> ${doc.scheduledAt.toLocaleDateString()}</p>` : ''}
              </div>
              ${doc.status === 'AwaitingPayment' ? 
                '<p style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px;"><strong>Action Required:</strong> Please log in to your account and complete the payment to proceed with delivery.</p>' : 
                ''
              }
              <p>Thank you for choosing Best Wishes!</p>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    res.status(200).json({ 
      success: true, 
      data: doc,
      message: `Surprise gift status updated to ${doc.status}` 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update surprise gift status', 
      error: err.message 
    });
  }
};

// Handle payment for surprise gift
exports.processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId, paymentMethod = 'stripe' } = req.body;

    const doc = await SurpriseGift.findById(id).populate('user', 'firstName lastName email phone');
    
    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        message: 'Surprise gift not found' 
      });
    }

    // Check if user owns this surprise gift
    if (doc.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }

    // Check if payment is required
    if (doc.status !== 'AwaitingPayment') {
      return res.status(400).json({
        success: false,
        message: 'Payment not required for this order status'
      });
    }

    if (doc.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    // Update payment status
    const updatedDoc = await SurpriseGift.findByIdAndUpdate(
      id,
      { 
        paymentStatus: 'paid', 
        status: 'Paid',
        paymentId: paymentId
      },
      { new: true }
    ).populate('user', 'firstName lastName email phone');

    // Create notification
    try {
      await Notification.create({
        user: updatedDoc.user._id,
        title: 'Payment Received',
        message: `Payment of $${updatedDoc.total.toFixed(2)} received for surprise gift for ${updatedDoc.recipientName}. Your order will be processed soon.`,
        type: 'payment',
        relatedId: updatedDoc._id
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    // Send confirmation email
    try {
      await sendEmail({
        to: updatedDoc.user.email,
        subject: 'Payment Confirmed - Surprise Gift Order',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #822BE2;">Payment Confirmed!</h2>
            <p>Dear ${updatedDoc.user.firstName || 'Customer'},</p>
            <p>Your payment of $${updatedDoc.total.toFixed(2)} has been successfully processed.</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Order Details:</h3>
              <p><strong>Recipient:</strong> ${updatedDoc.recipientName}</p>
              <p><strong>Phone:</strong> ${updatedDoc.recipientPhone}</p>
              <p><strong>Address:</strong> ${updatedDoc.shippingAddress}</p>
              <p><strong>Total Paid:</strong> $${updatedDoc.total.toFixed(2)}</p>
              <p><strong>Payment ID:</strong> ${paymentId}</p>
            </div>
            <p style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 10px; border-radius: 5px;">Your surprise gift will be processed and shipped soon. You'll receive tracking information once it's dispatched.</p>
            <p>Thank you for choosing Best Wishes!</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    res.status(200).json({ 
      success: true, 
      data: updatedDoc,
      message: 'Payment processed successfully' 
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process payment', 
      error: err.message 
    });
  }
};

/**
 * Start Packing Process for Surprise Gift
 * - Validates order status (must be 'Paid')
 * - Reduces product stock
 * - Creates order summary records
 * - Updates order status to 'OutForDelivery' (Packing)
 * - Uses MongoDB transactions for atomicity
 */
exports.startPackingSurpriseGift = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();
    
    const { id } = req.params;
    
    // Step 1: Fetch the surprise gift with populated product details
    const surpriseGift = await SurpriseGift.findById(id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name sku costPrice retailPrice salePrice stock')
      .session(session);
    
    if (!surpriseGift) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Surprise gift not found'
      });
    }
    
    // Step 2: Validate current status - should be 'Pending' to start packing
    if (surpriseGift.status !== 'Pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot start packing. Order status is '${surpriseGift.status}'. Expected 'Pending'.`
      });
    }
    
    // Step 3: Check stock availability for all products
    const stockValidation = [];
    const insufficientStockItems = [];
    
    for (const item of surpriseGift.items) {
      if (!item.product) {
        stockValidation.push({
          valid: false,
          error: `Product not found for item: ${item.name}`
        });
        continue;
      }
      
      const product = item.product;
      const requestedQty = item.quantity || 1;
      const availableStock = product.stock || 0;
      
      if (availableStock < requestedQty) {
        insufficientStockItems.push({
          productName: product.name,
          productSKU: product.sku,
          requestedQuantity: requestedQty,
          availableStock: availableStock
        });
        stockValidation.push({
          valid: false,
          error: `Insufficient stock for ${product.name}`
        });
      } else {
        stockValidation.push({
          valid: true,
          productId: product._id,
          requestedQty: requestedQty,
          availableStock: availableStock
        });
      }
    }
    
    // If any stock validation failed, abort transaction
    if (insufficientStockItems.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for some products',
        data: {
          insufficientStockItems
        }
      });
    }
    
    // Step 4: Reduce product stock
    const stockUpdates = [];
    for (const item of surpriseGift.items) {
      const product = item.product;
      const requestedQty = item.quantity || 1;
      
      const updatedProduct = await Product.findByIdAndUpdate(
        product._id,
        { 
          $inc: { stock: -requestedQty },
          $set: { 
            stockStatus: (product.stock - requestedQty) <= 0 ? 'out-of-stock' : 
                        (product.stock - requestedQty) <= 10 ? 'low-stock' : 'in-stock'
          }
        },
        { 
          new: true, 
          session: session 
        }
      );
      
      stockUpdates.push({
        productId: product._id,
        productName: product.name,
        previousStock: product.stock,
        newStock: updatedProduct.stock,
        quantityReduced: requestedQty
      });
    }
    
    // Step 5: Create order summary records
    const orderSummaryRecords = [];
    for (const item of surpriseGift.items) {
      const product = item.product;
      const quantity = item.quantity || 1;
      const costPrice = product.costPrice || 0;
      const retailPrice = product.retailPrice || 0;
      const salePrice = product.salePrice || retailPrice || 0;
      const profit = salePrice - costPrice;
      const totalProfit = profit * quantity;
      
      const summaryRecord = {
        giftId: surpriseGift._id,
        productSKU: product.sku,
        productId: product._id,
        productName: product.name,
        quantity: quantity,
        costPrice: costPrice,
        retailPrice: retailPrice,
        salePrice: salePrice,
        profit: profit,
        totalProfit: totalProfit,
        orderDate: new Date(),
        status: 'surprisegift'
      };
      
      orderSummaryRecords.push(summaryRecord);
    }
    
    // Insert order summary records
    const createdSummaries = await OrderSummary.insertMany(orderSummaryRecords, { session });
    
    // Step 6: Update surprise gift status to 'Packing' (Packing stage)
    const updatedSurpriseGift = await SurpriseGift.findByIdAndUpdate(
      id,
      { 
        status: 'Packing',
        packedAt: new Date()
      },
      { 
        new: true, 
        session: session 
      }
    ).populate('user', 'firstName lastName email phone');
    
    // Step 7: Create notification for user
    await Notification.create([{
      user: updatedSurpriseGift.user._id,
      title: 'Surprise Gift - Packing Started',
      message: `Your surprise gift for ${updatedSurpriseGift.recipientName} is now being packed and will be shipped soon!`,
      type: 'order',
      relatedId: updatedSurpriseGift._id
    }], { session });
    
    // Step 8: Send email notification
    try {
      if (updatedSurpriseGift.user.email) {
        await sendEmail({
          to: updatedSurpriseGift.user.email,
          subject: 'Surprise Gift - Packing Started',
          text: `Dear ${updatedSurpriseGift.user.firstName},\n\nYour surprise gift for ${updatedSurpriseGift.recipientName} is now being packed and will be shipped soon!\n\nOrder Total: $${updatedSurpriseGift.total.toFixed(2)}\nRecipient: ${updatedSurpriseGift.recipientName}\nPhone: ${updatedSurpriseGift.recipientPhone}\nAddress: ${updatedSurpriseGift.shippingAddress}\n\nThank you for choosing our service!`,
          html: `
            <h2>Surprise Gift - Packing Started</h2>
            <p>Dear ${updatedSurpriseGift.user.firstName},</p>
            <p>Your surprise gift for <strong>${updatedSurpriseGift.recipientName}</strong> is now being packed and will be shipped soon!</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Order Details:</h3>
              <p><strong>Order Total:</strong> $${updatedSurpriseGift.total.toFixed(2)}</p>
              <p><strong>Recipient:</strong> ${updatedSurpriseGift.recipientName}</p>
              <p><strong>Phone:</strong> ${updatedSurpriseGift.recipientPhone}</p>
              <p><strong>Address:</strong> ${updatedSurpriseGift.shippingAddress}</p>
            </div>
            <p>Thank you for choosing our service!</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't abort transaction for email errors
    }
    
    // Commit the transaction
    await session.commitTransaction();
    
    // Step 9: Return success response
    res.status(200).json({
      success: true,
      message: 'Packing process started successfully',
      data: {
        surpriseGift: updatedSurpriseGift,
        stockUpdates: stockUpdates,
        orderSummariesCreated: createdSummaries.length,
        totalProfit: orderSummaryRecords.reduce((sum, record) => sum + record.totalProfit, 0)
      }
    });
    
  } catch (error) {
    // Rollback transaction on any error
    await session.abortTransaction();
    console.error('Error in startPackingSurpriseGift:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to start packing process',
      error: error.message,
      details: 'All changes have been rolled back due to error'
    });
  } finally {
    // End the session
    await session.endSession();
  }
};

/**
 * Print Surprise Gift Details
 * Returns formatted data for printing order details
 */
exports.printSurpriseGiftDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const surpriseGift = await SurpriseGift.findById(id)
      .populate('user', 'firstName lastName email phone address')
      .populate('items.product', 'name sku images')
      .populate('deliveryStaffId', 'firstName lastName phone');
    
    if (!surpriseGift) {
      return res.status(404).json({
        success: false,
        message: 'Surprise gift not found'
      });
    }
    
    // Format data for printing
    const printData = {
      orderId: surpriseGift._id,
      orderDate: surpriseGift.createdAt,
      status: surpriseGift.status,
      
      // Sender Details
      sender: {
        name: `${surpriseGift.user.firstName} ${surpriseGift.user.lastName}`,
        email: surpriseGift.user.email,
        phone: surpriseGift.user.phone,
        address: surpriseGift.user.address || 'Not provided'
      },
      
      // Receiver Details
      receiver: {
        name: surpriseGift.recipientName,
        phone: surpriseGift.recipientPhone,
        address: surpriseGift.shippingAddress
      },
      
      // Order Details
      orderDetails: {
        costume: surpriseGift.costume || 'None',
        suggestions: surpriseGift.suggestions || 'None',
        scheduledAt: surpriseGift.scheduledAt,
        total: surpriseGift.total,
        paymentStatus: surpriseGift.paymentStatus,
        items: surpriseGift.items.map(item => ({
          name: item.name,
          sku: item.product?.sku || 'N/A',
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
          image: item.image
        }))
      },
      
      // Delivery Details
      delivery: {
        deliveryStaff: surpriseGift.deliveryStaffId ? 
          `${surpriseGift.deliveryStaffId.firstName} ${surpriseGift.deliveryStaffId.lastName}` : 
          'Not assigned',
        deliveryStaffPhone: surpriseGift.deliveryStaffId?.phone || 'N/A',
        deliveredAt: surpriseGift.deliveredAt,
        packedAt: surpriseGift.packedAt
      },
      
      // Print metadata
      printedAt: new Date(),
      printedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System'
    };
    
    res.status(200).json({
      success: true,
      message: 'Print data retrieved successfully',
      data: printData
    });
    
  } catch (error) {
    console.error('Error in printSurpriseGiftDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve print data',
      error: error.message
    });
  }
};

exports.printAllDeliveredOrders = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    // Build query for delivered orders
    let query = { status: 'Delivered' };
    
    // Apply date filters if provided
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    } else {
      // Default: last 2 weeks
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      query.createdAt = { $gte: twoWeeksAgo };
    }
    
    const orders = await SurpriseGift.find(query)
      .populate('user', 'firstName lastName email phone address')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });
    
    // Format orders for printing
    const printData = orders.map(order => ({
      orderId: order._id.toString().slice(-8).toUpperCase(),
      orderDate: order.createdAt,
      status: order.status,
      
      sender: {
        name: `${order.user.firstName} ${order.user.lastName}`,
        email: order.user.email,
        phone: order.user.phone || 'N/A',
        address: order.user.address || 'Address not provided'
      },
      
      receiver: {
        name: order.recipientName,
        phone: order.recipientPhone,
        address: order.shippingAddress
      },
      
      orderDetails: {
        items: order.items.map(item => ({
          name: item.name,
          sku: item.product?.sku || item.product?._id?.toString().slice(-6) || 'N/A',
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        total: order.total,
        costume: order.costume || 'None',
        suggestions: order.suggestions || 'None',
        scheduledAt: order.scheduledAt
      },
      
      delivery: {
        deliveryStaff: 'N/A', // Can be populated if you have delivery staff info
        deliveryStaffPhone: 'N/A',
        packedAt: order.packedAt,
        deliveredAt: order.deliveredAt
      }
    }));
    
    res.status(200).json({
      success: true,
      message: 'Print data for all delivered orders retrieved successfully',
      data: {
        orders: printData,
        totalOrders: printData.length,
        printedAt: new Date(),
        printedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System',
        dateRange: {
          from: fromDate || 'N/A',
          to: toDate || 'N/A'
        }
      }
    });
    
  } catch (error) {
    console.error('Error in printAllDeliveredOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve print data for delivered orders',
      error: error.message
    });
  }
};


