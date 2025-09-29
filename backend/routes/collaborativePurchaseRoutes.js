const express = require('express');
const router = express.Router();
const collaborativePurchaseController = require('../controllers/collaborativePurchaseController');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');

// Admin routes - Get all collaborative purchases
router.get('/all', isAuthenticated, authorizeRoles('admin'), collaborativePurchaseController.getAllCollaborativePurchases);

// Admin routes - Print individual collaborative purchase details
router.get('/:id/print', isAuthenticated, authorizeRoles('admin'), collaborativePurchaseController.printCollaborativePurchaseDetails);

// Admin routes - Print all delivered collaborative purchases
router.get('/print-all-delivered', isAuthenticated, authorizeRoles('admin'), collaborativePurchaseController.printAllDeliveredCollaborativePurchases);

// Admin routes - Start packing process
router.post('/:id/start-packing', isAuthenticated, authorizeRoles('admin'), collaborativePurchaseController.startPacking);

// Admin routes - Update status
router.put('/:id/status', isAuthenticated, authorizeRoles('admin'), collaborativePurchaseController.updateCollaborativeStatus);

// Create collaborative purchase
router.post('/', isAuthenticated, collaborativePurchaseController.createCollaborativePurchase);

// Get collaborative purchase details
router.get('/:id', isAuthenticated, collaborativePurchaseController.getCollaborativePurchase);

// Get collaborative purchase by payment link (public route for participants)
router.get('/payment/:paymentLink', collaborativePurchaseController.getCollaborativePurchaseByPaymentLink);

// Process payment for a participant
router.post('/payment/:paymentLink', collaborativePurchaseController.processPayment);

// Decline participation
router.post('/decline/:paymentLink', collaborativePurchaseController.declineParticipation);

// Get user's collaborative purchases
router.get('/', isAuthenticated, collaborativePurchaseController.getUserCollaborativePurchases);

// Cancel collaborative purchase (creator only)
router.post('/:id/cancel', isAuthenticated, collaborativePurchaseController.cancelCollaborativePurchase);

module.exports = router;
