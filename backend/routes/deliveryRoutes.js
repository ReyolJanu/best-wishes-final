const express = require('express');
const {
  getAllOrders,
  updateOrderStatus,
  getDeliveryStaffProfile,
  updateDeliveryStaffProfile,
  getDeliveryStats,
  getOrderDetails,
  searchOrders,
  getAllSurpriseGifts,
  updateSurpriseGiftStatus,
  getSurpriseGiftsStats
} = require('../controllers/deliveryController');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication and delivery staff role
router.use(isAuthenticated);
router.use(authorizeRoles('deliveryStaff'));

// Order management routes
router.get('/orders', getAllOrders);
router.get('/orders/search', searchOrders);
router.get('/orders/:orderId', getOrderDetails);
router.put('/orders/:orderId/status', updateOrderStatus);

// Surprise gift management routes
router.get('/surprise-gifts', getAllSurpriseGifts);
router.put('/surprise-gifts/:surpriseGiftId/status', updateSurpriseGiftStatus);
router.get('/surprise-gifts/stats', getSurpriseGiftsStats);

// Profile management routes
router.get('/profile', getDeliveryStaffProfile);
router.put('/profile', updateDeliveryStaffProfile);

// Dashboard statistics
router.get('/stats', getDeliveryStats);

module.exports = router;
