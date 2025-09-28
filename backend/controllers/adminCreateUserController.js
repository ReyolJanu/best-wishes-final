const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Controller for admin-only user creation
 * Provides secure endpoint for admins to create new staff users
 */

/**
 * Create a new user (Admin only)
 * @route POST /api/admin/users
 * @access Private/Admin
 */
const adminCreateUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      address,
      profileImage,
      twoFactorEnabled = false,
      isBlocked = false
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, password, role'
      });
    }

    // Validate role
    const validRoles = ['admin', 'inventoryManager', 'deliveryStaff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check password contains number and symbol
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasNumber || !hasSymbol) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one number and one symbol'
      });
    }

    // Check email uniqueness
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password, // Will be hashed by pre-save middleware
      role,
      phone: phone || '',
      address: address || '',
      profileImage: profileImage || '',
      twoFactorEnabled: Boolean(twoFactorEnabled),
      isBlocked: Boolean(isBlocked)
    });

    // Save user (password will be hashed by pre-save middleware)
    const savedUser = await newUser.save();

    // Create audit log entry
    const auditEntry = {
      actor: req.user._id,
      action: 'user.create',
      target: savedUser._id,
      timestamp: new Date(),
      metadata: {
        targetEmail: savedUser.email,
        targetRole: savedUser.role,
        actorEmail: req.user.email
      }
    };

    // Log audit entry (you can extend this to save to a dedicated audit collection)
    console.log('AUDIT LOG:', JSON.stringify(auditEntry, null, 2));

    // Return sanitized user data (no password)
    const userResponse = {
      _id: savedUser._id,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      role: savedUser.role,
      phone: savedUser.phone,
      address: savedUser.address,
      profileImage: savedUser.profileImage,
      twoFactorEnabled: savedUser.twoFactorEnabled,
      isBlocked: savedUser.isBlocked,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Error in adminCreateUser:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating user'
    });
  }
};

/**
 * Check if email is already in use
 * @route GET /api/admin/users/check-email/:email
 * @access Private/Admin
 */
const checkEmailUniqueness = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    res.status(200).json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Email is already in use' : 'Email is available'
    });

  } catch (error) {
    console.error('Error in checkEmailUniqueness:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while checking email'
    });
  }
};

module.exports = {
  adminCreateUser,
  checkEmailUniqueness
};