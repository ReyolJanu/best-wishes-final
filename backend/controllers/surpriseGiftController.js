const SurpriseGift = require('../models/SurpriseGift');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/sendEmail');

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
    
    const validStatuses = ['Pending','Scheduled','OutForDelivery','Delivered','Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ') 
      });
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
      await Notification.create({
        user: doc.user._id,
        title: 'Surprise Gift Update',
        message: `Your surprise gift for ${doc.recipientName} has been ${status.toLowerCase()}.`,
        type: 'order',
        relatedId: doc._id
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    // Send email notification
    try {
      const statusMessages = {
        'Scheduled': `Your surprise gift for ${doc.recipientName} has been scheduled for delivery.`,
        'OutForDelivery': `Your surprise gift for ${doc.recipientName} is now out for delivery!`,
        'Delivered': `Your surprise gift for ${doc.recipientName} has been successfully delivered.`,
        'Cancelled': `Your surprise gift for ${doc.recipientName} has been cancelled.`
      };

      if (statusMessages[status]) {
        await sendEmail({
          to: doc.user.email,
          subject: `Surprise Gift ${status} - Best Wishes`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #822BE2;">Surprise Gift Update</h2>
              <p>Dear ${doc.user.firstName || 'Customer'},</p>
              <p>${statusMessages[status]}</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Order Details:</h3>
                <p><strong>Recipient:</strong> ${doc.recipientName}</p>
                <p><strong>Phone:</strong> ${doc.recipientPhone}</p>
                <p><strong>Address:</strong> ${doc.shippingAddress}</p>
                <p><strong>Total:</strong> $${doc.total.toFixed(2)}</p>
                ${doc.scheduledAt ? `<p><strong>Scheduled At:</strong> ${doc.scheduledAt.toLocaleDateString()}</p>` : ''}
              </div>
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
      message: `Surprise gift status updated to ${status}` 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update surprise gift status', 
      error: err.message 
    });
  }
};


