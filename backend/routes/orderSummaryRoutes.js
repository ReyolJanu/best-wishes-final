const express = require('express');
const { createOrderSummary, getOrderSummaries, getProfitAnalytics } = require('../controllers/orderSummaryController');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();

// Create order summary records
router.post('/create', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), createOrderSummary);

// Get order summary records
router.get('/all', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), getOrderSummaries);

// Get profit analytics
router.get('/analytics', isAuthenticated, authorizeRoles('admin'), getProfitAnalytics);

module.exports = router;