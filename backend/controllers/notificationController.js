const Notification = require('../models/Notification');
const { sendEmail } = require('../config/emailConfig');

// Create a new notification
const createNotification = async (userId, title, message, type = 'order', relatedId = null, relatedModel = null, priority = 'medium', actionUrl = null, req = null) => {
  try {
    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
      relatedId,
      relatedModel,
      priority,
      actionUrl
    });

    await notification.save();

    // Emit real-time notification if req object is available (contains app instance)
    if (req && req.app) {
      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      
      if (io && userSockets) {
        const socketId = userSockets.get(userId.toString());
        if (socketId) {
          io.to(socketId).emit('newNotification', {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            createdAt: notification.createdAt,
            isRead: notification.isRead
          });
          console.log(`📱 Real-time notification sent to user ${userId}`);
        }
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedId', 'name _id');

    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      isRead: false 
    });

    const totalCount = await Notification.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Create order status notification
const createOrderStatusNotification = async (userId, orderId, status, userEmail = null, userName = null, req = null) => {
  try {
    let title = '';
    let message = '';
    let emailSubject = '';
    let emailContent = '';
    let shouldSendEmail = false;

    const orderIdShort = orderId.toString().slice(-6);

    switch (status) {
      case 'pending':
        title = 'Order Created Successfully';
        message = `Your order #${orderIdShort} has been created and is pending confirmation.`;
        emailSubject = 'Order Confirmation - Best Wishes';
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #822be2;">Order Created Successfully! 🎉</h2>
            <p>Dear ${userName || 'Customer'},</p>
            <p>Thank you for your order! Your order <strong>#${orderIdShort}</strong> has been created successfully and is pending confirmation.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #822be2; margin-top: 0;">Order Status: Pending</h3>
              <p>We'll review your order and confirm it shortly. You'll receive another notification once your order is confirmed.</p>
            </div>
            <p>Thank you for choosing Best Wishes!</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best Wishes Team<br>
              <a href="${process.env.FRONTEND_URL}" style="color: #822be2;">Visit Our Website</a>
            </p>
          </div>
        `;
        shouldSendEmail = true;
        break;

      case 'processing':
        title = 'Order Confirmed';
        message = `Your order #${orderIdShort} has been confirmed and is now being processed.`;
        emailSubject = 'Order Confirmed - Now Processing';
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #822be2;">Order Confirmed! ✅</h2>
            <p>Dear ${userName || 'Customer'},</p>
            <p>Great news! Your order <strong>#${orderIdShort}</strong> has been confirmed and is now being processed by our team.</p>
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">Order Status: Processing</h3>
              <p>Our team is now preparing your items for packaging. We'll notify you once your order moves to the packing stage.</p>
            </div>
            <p>Thank you for your patience!</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best Wishes Team<br>
              <a href="${process.env.FRONTEND_URL}" style="color: #822be2;">Track Your Order</a>
            </p>
          </div>
        `;
        shouldSendEmail = true;
        break;

      case 'packing':
        title = 'Order Being Packed';
        message = `Your order #${orderIdShort} is now being packed for shipment.`;
        emailSubject = 'Order Being Packed';
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #822be2;">Your Order is Being Packed! 📦</h2>
            <p>Dear ${userName || 'Customer'},</p>
            <p>Your order <strong>#${orderIdShort}</strong> is now being carefully packed by our team.</p>
            <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #f57c00; margin-top: 0;">Order Status: Packing</h3>
              <p>We're carefully packing your items to ensure they arrive in perfect condition. Your order will be ready for delivery soon!</p>
            </div>
            <p>Stay tuned for shipping updates!</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best Wishes Team<br>
              <a href="${process.env.FRONTEND_URL}" style="color: #822be2;">Track Your Order</a>
            </p>
          </div>
        `;
        shouldSendEmail = true;
        break;

      case 'shipped':
        title = 'Order Ready for Delivery';
        message = `Your order #${orderIdShort} is packed and ready for delivery!`;
        emailSubject = 'Order Ready for Delivery! 🚚';
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #822be2;">Ready for Delivery! 🚚</h2>
            <p>Dear ${userName || 'Customer'},</p>
            <p>Exciting news! Your order <strong>#${orderIdShort}</strong> has been packed and is now ready for delivery.</p>
            <div style="background-color: #f3e5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #7b1fa2; margin-top: 0;">Order Status: Ready for Delivery</h3>
              <p>Your order is now with our delivery team and will be delivered to your address soon. Please ensure someone is available to receive the package.</p>
            </div>
            <p><strong>Important:</strong> Please keep your phone handy as our delivery team may contact you.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best Wishes Team<br>
              <a href="${process.env.FRONTEND_URL}" style="color: #822be2;">Track Your Order</a>
            </p>
          </div>
        `;
        shouldSendEmail = true;
        break;

      case 'delivered':
        title = 'Order Delivered Successfully';
        message = `Your order #${orderIdShort} has been delivered successfully! Thank you for choosing Best Wishes.`;
        emailSubject = 'Order Delivered Successfully! 🎁';
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #822be2;">Order Delivered Successfully! 🎁</h2>
            <p>Dear ${userName || 'Customer'},</p>
            <p>We're happy to confirm that your order <strong>#${orderIdShort}</strong> has been delivered successfully!</p>
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2e7d32; margin-top: 0;">Order Status: Delivered ✅</h3>
              <p>We hope you love your purchase! If you have any questions or concerns about your order, please don't hesitate to contact us.</p>
            </div>
            <p>Thank you for choosing Best Wishes. We look forward to serving you again!</p>
            <p><strong>Rate Your Experience:</strong> We'd love to hear about your experience. Please consider leaving a review!</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best Wishes Team<br>
              <a href="${process.env.FRONTEND_URL}" style="color: #822be2;">Shop Again</a>
            </p>
          </div>
        `;
        shouldSendEmail = true;
        break;

      case 'cancelled':
        title = 'Order Cancelled';
        message = `Your order #${orderIdShort} has been cancelled.`;
        emailSubject = 'Order Cancelled';
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #822be2;">Order Cancelled</h2>
            <p>Dear ${userName || 'Customer'},</p>
            <p>We regret to inform you that your order <strong>#${orderIdShort}</strong> has been cancelled.</p>
            <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #d32f2f; margin-top: 0;">Order Status: Cancelled</h3>
              <p>If this cancellation was unexpected, please contact our customer service team for assistance.</p>
            </div>
            <p>We apologize for any inconvenience caused.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best Wishes Team<br>
              <a href="${process.env.FRONTEND_URL}" style="color: #822be2;">Contact Support</a>
            </p>
          </div>
        `;
        shouldSendEmail = true;
        break;

      default:
        title = 'Order Status Updated';
        message = `Your order #${orderIdShort} status has been updated to ${status}.`;
        break;
    }

    // Create notification
    const notification = await createNotification(
      userId,
      title,
      message,
      'order',
      orderId,
      'Order',
      'medium',
      `/orders/${orderId}`,
      req
    );

    // Send email notification if required and email is provided
    if (shouldSendEmail && userEmail) {
      try {
        await sendEmail({
          to: userEmail,
          subject: emailSubject,
          html: emailContent
        });
        console.log(`📧 Email notification sent to ${userEmail} for order ${orderIdShort}`);
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't throw error for email failure, just log it
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating order status notification:', error);
    throw error;
  }
};

// Get unread count for a user
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      isRead: false 
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createOrderStatusNotification,
  getUnreadCount
};
