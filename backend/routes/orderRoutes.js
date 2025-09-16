const express = require('express');
const { getUserOrderHistory, createOrder, getAllOrders, updateOrderToPacking, updateOrderToShipped, updateOrderToDelivered, deleteOrder } = require('../controllers/orderController');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();

// Get order history for logged-in user
router.get('/history', isAuthenticated, getUserOrderHistory);

// Create order after payment success
router.post('/create', isAuthenticated, createOrder);

// Get all orders for admin and inventory manager
router.get('/all', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), getAllOrders);

// Update order status to Packing - admin and inventory manager
router.put('/update-to-packing', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), updateOrderToPacking);

// Update order status to Shipped - admin and inventory manager
router.put('/update-to-shipped', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), updateOrderToShipped);

// Update order status to Delivered - admin and inventory manager
router.put('/update-to-delivered', isAuthenticated, authorizeRoles('admin', 'inventoryManager'), updateOrderToDelivered);

// Delete order
router.delete('/:orderId', isAuthenticated, deleteOrder);

module.exports = router;
