const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const { 
  createSurpriseGift, 
  getMySurpriseGifts,
  getAllSurpriseGifts,
  updateSurpriseGiftStatus,
  getSurpriseGiftById,
  processPayment
} = require('../controllers/surpriseGiftController');

// User routes
router.post('/', isAuthenticated, createSurpriseGift);
router.get('/my', isAuthenticated, getMySurpriseGifts);
router.post('/:id/payment', isAuthenticated, processPayment);

// Admin routes
router.get('/all', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), getAllSurpriseGifts);
router.get('/:id', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), getSurpriseGiftById);
router.put('/:id/status', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), updateSurpriseGiftStatus);

module.exports = router;


