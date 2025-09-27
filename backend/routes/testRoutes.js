const express = require('express');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

// Test authentication endpoint
router.get('/test-auth', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication successful',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;