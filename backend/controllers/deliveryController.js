const Order = require('../models/Order');
const User = require('../models/User');
const SurpriseGift = require('../models/SurpriseGift');

const { createOrderStatusNotification } = require('./notificationController');


// Get all orders for delivery staff management
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, deliveryStaff } = req.query;
    
    // Build filter object
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Filter by delivery staff if provided (for delivered items history)
    if (deliveryStaff) {
      filter.deliveryStaffId = deliveryStaff;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch orders with pagination
    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email phone address')
      .populate('items.product', 'name images salePrice retailPrice')
      .sort({ orderedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: page < Math.ceil(totalOrders / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: err.message
    });
  }
};

// Update order status by delivery staff
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes, deliveryStaffId } = req.body;
    const currentUserId = req.user._id;

    // Validate status
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Find and update order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order with delivery staff info
    order.status = status;
    order.updatedBy = currentUserId;
    order.updatedAt = new Date();
    
    // Store delivery staff ID and delivery date when marking as delivered
    if (status === 'Delivered' && deliveryStaffId) {
      order.deliveryStaffId = deliveryStaffId;
      order.deliveredAt = new Date();
    }
    
    // Add status history
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    
    order.statusHistory.push({
      status,
      updatedBy: currentUserId,
      updatedAt: new Date(),
      notes: notes || ''
    });

    await order.save();

    // Populate the updated order
    const updatedOrder = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone address')
      .populate('items.product', 'name images salePrice retailPrice')
      .populate('updatedBy', 'firstName lastName');

    // Send notification for delivered orders
    if (status === 'Delivered') {
      try {
        await createOrderStatusNotification(
          order.user,
          order._id,
          'delivered',
          updatedOrder.user?.email,
          `${updatedOrder.user?.firstName} ${updatedOrder.user?.lastName}`.trim(),
          req
        );
      } catch (notificationError) {
        console.error('Error creating notification for delivery:', notificationError);
        // Don't fail the main operation if notification fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: err.message
    });
  }
};

// Get delivery staff profile
exports.getDeliveryStaffProfile = async (req, res) => {
  try {
    const deliveryStaff = await User.findById(req.user._id).select('-password');
    
    if (!deliveryStaff) {
      return res.status(404).json({
        success: false,
        message: 'Delivery staff not found'
      });
    }

    res.status(200).json({
      success: true,
      user: deliveryStaff
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: err.message
    });
  }
};

// Update delivery staff profile
exports.updateDeliveryStaffProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, profileImage } = req.body;
    const deliveryStaffId = req.user._id;

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const updatedStaff = await User.findByIdAndUpdate(
      deliveryStaffId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedStaff
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: err.message
    });
  }
};

// Get delivery statistics for dashboard
exports.getDeliveryStats = async (req, res) => {
  try {
    const deliveryStaffId = req.user._id;
    
    // Get orders updated by this delivery staff
    const totalOrders = await Order.countDocuments({ updatedBy: deliveryStaffId });
    const pendingOrders = await Order.countDocuments({ 
      updatedBy: deliveryStaffId, 
      status: 'Pending' 
    });
    const inTransitOrders = await Order.countDocuments({ 
      updatedBy: deliveryStaffId, 
      status: 'Shipped' 
    });
    const deliveredOrders = await Order.countDocuments({ 
      updatedBy: deliveryStaffId, 
      status: 'Delivered' 
    });
    const cancelledOrders = await Order.countDocuments({ 
      updatedBy: deliveryStaffId, 
      status: 'Cancelled' 
    });

    // Get recent orders
    const recentOrders = await Order.find({ updatedBy: deliveryStaffId })
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        inTransitOrders,
        deliveredOrders,
        cancelledOrders
      },
      recentOrders
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery statistics',
      error: err.message
    });
  }
};

// Get order details by ID
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone address')
      .populate('items.product', 'name images salePrice retailPrice description')
      .populate('updatedBy', 'firstName lastName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: err.message
    });
  }
};

// Search orders
exports.searchOrders = async (req, res) => {
  try {
    const { query, status, page = 1, limit = 10 } = req.query;
    
    // Build search filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    let orders;
    let totalOrders;

    if (query) {
      // Search by order ID, customer name, or email
      const searchRegex = new RegExp(query, 'i');
      
      orders = await Order.find({
        ...filter,
        $or: [
          { _id: { $regex: searchRegex } },
          { 'user.firstName': { $regex: searchRegex } },
          { 'user.lastName': { $regex: searchRegex } },
          { 'user.email': { $regex: searchRegex } }
        ]
      })
        .populate('user', 'firstName lastName email phone address')
        .populate('items.product', 'name images salePrice retailPrice')
        .sort({ orderedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      totalOrders = await Order.countDocuments({
        ...filter,
        $or: [
          { _id: { $regex: searchRegex } },
          { 'user.firstName': { $regex: searchRegex } },
          { 'user.lastName': { $regex: searchRegex } },
          { 'user.email': { $regex: searchRegex } }
        ]
      });
    } else {
      orders = await Order.find(filter)
        .populate('user', 'firstName lastName email phone address')
        .populate('items.product', 'name images salePrice retailPrice')
        .sort({ orderedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      totalOrders = await Order.countDocuments(filter);
    }

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: page < Math.ceil(totalOrders / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to search orders',
      error: err.message
    });
  }
};

// Get all surprise gifts for delivery staff management
exports.getAllSurpriseGifts = async (req, res) => {
  try {
    const { status = 'OutForDelivery', page = 1, limit = 10, deliveryStaff } = req.query;
    
    // Build filter object - only show OutForDelivery by default
    const filter = { status: 'OutForDelivery' };
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Filter by delivery staff if provided (for delivered items history)
    if (deliveryStaff) {
      filter.deliveryStaffId = deliveryStaff;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch surprise gifts with pagination
    const surpriseGifts = await SurpriseGift.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images salePrice retailPrice')
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalSurpriseGifts = await SurpriseGift.countDocuments(filter);

    res.status(200).json({
      success: true,
      surpriseGifts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSurpriseGifts / limit),
        totalSurpriseGifts,
        hasNext: page < Math.ceil(totalSurpriseGifts / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch surprise gifts',
      error: err.message
    });
  }
};

// Update surprise gift status by delivery staff
exports.updateSurpriseGiftStatus = async (req, res) => {
  try {
    const { surpriseGiftId } = req.params;
    const { status, notes, deliveryStaffId } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Scheduled', 'OutForDelivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Find and update surprise gift
    const surpriseGift = await SurpriseGift.findById(surpriseGiftId);
    if (!surpriseGift) {
      return res.status(404).json({
        success: false,
        message: 'Surprise gift not found'
      });
    }

    // Update surprise gift status
    surpriseGift.status = status;
    
    // Store delivery staff ID and delivery date when marking as delivered
    if (status === 'Delivered' && deliveryStaffId) {
      surpriseGift.deliveryStaffId = deliveryStaffId;
      surpriseGift.deliveredAt = new Date();
    }
    
    await surpriseGift.save();

    // Populate the updated surprise gift
    const updatedSurpriseGift = await SurpriseGift.findById(surpriseGiftId)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images salePrice retailPrice');

    res.status(200).json({
      success: true,
      message: 'Surprise gift status updated successfully',
      surpriseGift: updatedSurpriseGift
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update surprise gift status',
      error: err.message
    });
  }
};

// Get delivery statistics for surprise gifts
exports.getSurpriseGiftsStats = async (req, res) => {
  try {
    // Get all surprise gifts statistics (not filtered by delivery staff since the model doesn't track that)
    const totalSurpriseGifts = await SurpriseGift.countDocuments({});
    const pendingSurpriseGifts = await SurpriseGift.countDocuments({ status: 'Pending' });
    const scheduledSurpriseGifts = await SurpriseGift.countDocuments({ status: 'Scheduled' });
    const outForDeliverySurpriseGifts = await SurpriseGift.countDocuments({ status: 'OutForDelivery' });
    const deliveredSurpriseGifts = await SurpriseGift.countDocuments({ status: 'Delivered' });
    const cancelledSurpriseGifts = await SurpriseGift.countDocuments({ status: 'Cancelled' });

    // Get recent surprise gifts
    const recentSurpriseGifts = await SurpriseGift.find({})
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalSurpriseGifts,
        pendingSurpriseGifts,
        scheduledSurpriseGifts,
        outForDeliverySurpriseGifts,
        deliveredSurpriseGifts,
        cancelledSurpriseGifts
      },
      recentSurpriseGifts
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch surprise gift statistics',
      error: err.message
    });
  }
};
