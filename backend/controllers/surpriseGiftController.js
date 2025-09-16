const SurpriseGift = require('../models/SurpriseGift');
const Notification = require('../models/Notification');
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
    const docs = await SurpriseGift.find()
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

exports.updateSurpriseGiftStatus = async (req, res) => {
  try {

    const { status, scheduledAt, deliveryStaffId } = req.body;

    const { id } = req.params;
    
    const validStatuses = ['Pending','Confirmed','AwaitingPayment','Paid','OutForDelivery','Delivered','Cancelled'];
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
      
      if (currentGift.paymentStatus !== 'paid') {
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
      let notificationMessage = '';
      switch(doc.status) {
        case 'AwaitingPayment':
          notificationMessage = `Your surprise gift for ${doc.recipientName} has been confirmed. Please complete payment to proceed.`;
          break;
        case 'Paid':
          notificationMessage = `Payment received for surprise gift for ${doc.recipientName}. Your order will be processed soon.`;
          break;
        case 'OutForDelivery':
          notificationMessage = `Your surprise gift for ${doc.recipientName} is now out for delivery!`;
          break;
        case 'Delivered':
          notificationMessage = `Your surprise gift for ${doc.recipientName} has been successfully delivered.`;
          break;
        case 'Cancelled':
          notificationMessage = `Your surprise gift for ${doc.recipientName} has been cancelled.`;
          break;
        default:
          notificationMessage = `Your surprise gift for ${doc.recipientName} status has been updated to ${doc.status.toLowerCase()}.`;
      }

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


