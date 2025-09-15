const express = require('express');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const { listUsersWithStats, bulkActivateUsers, bulkDeactivateUsers, bulkDeleteUsers, getUserById } = require('../controllers/userController');

const router = express.Router();

// Get single user by ID (for collaborative purchases)
router.get('/users/:id', getUserById);

// Admin: list users with stats
router.get('/admin/users', isAuthenticated, authorizeRoles('admin'), listUsersWithStats);
router.post('/admin/users/activate', isAuthenticated, authorizeRoles('admin'), bulkActivateUsers);
router.post('/admin/users/deactivate', isAuthenticated, authorizeRoles('admin'), bulkDeactivateUsers);
router.delete('/admin/users', isAuthenticated, authorizeRoles('admin'), bulkDeleteUsers);

module.exports = router;


