const express = require('express');
const { getUserOrderHistory, createOrder, getAllOrders, updateOrderToPacking, updateOrderToShipped, updateOrderToDelivered } = require('../controllers/orderController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const router = express.Router();

// Get order history for logged-in user
router.get('/history', isAuthenticated, getUserOrderHistory);

// Create order after payment success
router.post('/', isAuthenticated, createOrder);

// Get all orders for admin
router.get('/all', getAllOrders);

// Update order status to Packing
router.put('/update-to-packing', updateOrderToPacking);

// Update order status to Shipped
router.put('/update-to-shipped', updateOrderToShipped);

// Update order status to Delivered
router.put('/update-to-delivered', updateOrderToDelivered);

module.exports = router;
