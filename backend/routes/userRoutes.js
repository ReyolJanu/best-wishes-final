const express = require('express');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const { listUsersWithStats, bulkActivateUsers, bulkDeactivateUsers, bulkDeleteUsers } = require('../controllers/userController');

const router = express.Router();

// Admin: list users with stats
router.get('/admin/users', isAuthenticated, authorizeRoles('admin'), listUsersWithStats);
router.post('/admin/users/activate', isAuthenticated, authorizeRoles('admin'), bulkActivateUsers);
router.post('/admin/users/deactivate', isAuthenticated, authorizeRoles('admin'), bulkDeactivateUsers);
router.delete('/admin/users', isAuthenticated, authorizeRoles('admin'), bulkDeleteUsers);

module.exports = router;


