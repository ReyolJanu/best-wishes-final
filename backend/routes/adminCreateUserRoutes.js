const express = require('express');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const { adminCreateUserRateLimit } = require('../utils/rateLimiter');
const { adminCreateUser, checkEmailUniqueness } = require('../controllers/adminCreateUserController');

const router = express.Router();

// Admin: Create new user (with rate limiting)
router.post('/admin/users', adminCreateUserRateLimit, isAuthenticated, authorizeRoles('admin'), adminCreateUser);

// Admin: Check email uniqueness
router.get('/admin/users/check-email/:email', isAuthenticated, authorizeRoles('admin'), checkEmailUniqueness);

module.exports = router;