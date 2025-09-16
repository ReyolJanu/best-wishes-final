const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Order = require('../models/Order');
const cloudinary = require('../config/cloudinary');

// GET /api/admin/users
// Requires admin
exports.listUsersWithStats = async (req, res) => {
  try {
    // fetch users basic details including all necessary fields for roles management
    const users = await User.find({}, 'firstName lastName email phone address role createdAt lastLogin lastActiveAt profileImage isBlocked twoFactorEnabled').lean();

    if (!users.length) {
      return res.status(200).json({ users: [] });
    }

    const userIds = users.map(u => u._id);

    // aggregate orders per user for totals and count
    const orderAgg = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', totalBuyingAmount: { $sum: '$total' }, orders: { $count: {} } } }
    ]);

    const userIdToOrder = new Map(orderAgg.map(o => [String(o._id), o]));

    const now = Date.now();
    const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

    const result = users.map(u => {
      const o = userIdToOrder.get(String(u._id)) || { totalBuyingAmount: 0, orders: 0 };
      const isActiveRealtime = u.lastActiveAt ? (now - new Date(u.lastActiveAt).getTime()) <= ACTIVE_WINDOW_MS : false;
      // Respect blocked users
      const status = u.isBlocked ? 'Inactive' : (isActiveRealtime ? 'Active' : 'Inactive');
      return {
        _id: u._id,
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        phone: u.phone || '',
        address: u.address || '',
        role: u.role,
        accountCreated: u.createdAt,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin || null,
        lastActiveAt: u.lastActiveAt || null,
        status,
        isBlocked: u.isBlocked || false,
        twoFactorEnabled: u.twoFactorEnabled || false,
        totalBuyingAmount: o.totalBuyingAmount || 0,
        orders: o.orders || 0,
        avatar: u.profileImage || '',
        profileImage: u.profileImage || ''
      };
    });

    return res.status(200).json({ users: result });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// POST /api/admin/users/activate
// body: { userIds: string[] }
exports.bulkActivateUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds required' });
    }
    await User.updateMany({ _id: { $in: userIds } }, { $set: { isBlocked: false } });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to activate users', error: err.message });
  }
};

// POST /api/admin/users/deactivate
// body: { userIds: string[] }
exports.bulkDeactivateUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds required' });
    }
    await User.updateMany({ _id: { $in: userIds } }, { $set: { isBlocked: true } });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to deactivate users', error: err.message });
  }
};

// DELETE /api/admin/users
// body: { userIds: string[] }
exports.bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds required' });
    }
    // Prevent self-delete
    const filtered = userIds.filter(id => String(id) !== String(req.user._id));
    if (filtered.length === 0) {
      return res.status(400).json({ message: 'Cannot delete current user' });
    }
    await User.deleteMany({ _id: { $in: filtered } });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete users', error: err.message });
  }
};

// PUT /api/admin/users/:id
// Update user details
exports.updateUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, address } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    updateData.updatedAt = new Date();

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true })
      .select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'User updated successfully',
      user: updatedUser 
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};

// PUT /api/admin/users/:id/change-password
// Change user password
exports.changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { 
        password: hashedPassword,
        updatedAt: new Date()
      }, 
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Password changed successfully'
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to change password', error: err.message });
  }
};

// Update admin profile information
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, phone } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        phone,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile', 
      error: err.message 
    });
  }
};

// Update admin profile image
exports.updateProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'user-profiles',
      transformation: [
        { width: 300, height: 300, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    // Update user profile image
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profileImage: result.secure_url,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: result.secure_url,
      user: updatedUser
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile image', 
      error: err.message 
    });
  }
};

// Remove admin profile image
exports.removeProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;

    // Update user profile image to empty string
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profileImage: '',
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile image removed successfully',
      user: updatedUser
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to remove profile image', 
      error: err.message 
    });
  }
};


