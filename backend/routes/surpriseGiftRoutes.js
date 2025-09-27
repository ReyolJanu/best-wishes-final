const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const { 
  createSurpriseGift, 
  getMySurpriseGifts,
  getAllSurpriseGifts,
  updateSurpriseGiftStatus,
  getSurpriseGiftById,
  processPayment,
  startPackingSurpriseGift,
  printSurpriseGiftDetails,
  cancelSurpriseGift,
  printAllDeliveredOrders
} = require('../controllers/surpriseGiftController');

// User routes
router.post('/', isAuthenticated, createSurpriseGift);
router.get('/my', isAuthenticated, getMySurpriseGifts);
router.post('/:id/payment', isAuthenticated, processPayment);

// Admin routes
router.get('/all', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), getAllSurpriseGifts);
router.get('/print-all-delivered', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), printAllDeliveredOrders);
router.get('/:id', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), getSurpriseGiftById);
router.put('/:id/status', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), updateSurpriseGiftStatus);
router.put('/:id/cancel', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), cancelSurpriseGift);
router.post('/:id/start-packing', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), startPackingSurpriseGift);
router.get('/:id/print', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), printSurpriseGiftDetails);

module.exports = router;


