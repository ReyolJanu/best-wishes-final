const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');

// GET /api/admin/users
// Requires admin
exports.listUsersWithStats = async (req, res) => {
  try {
    // fetch users basic details
    const users = await User.find({}, 'firstName lastName email createdAt lastLogin lastActiveAt profileImage').lean();

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
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        accountCreated: u.createdAt,
        lastLogin: u.lastLogin || null,
        status,
        totalBuyingAmount: o.totalBuyingAmount || 0,
        orders: o.orders || 0,
        avatar: u.profileImage || ''
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


