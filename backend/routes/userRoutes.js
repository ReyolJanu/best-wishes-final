const express = require('express');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const { 
  listUsersWithStats, 
  bulkActivateUsers, 
  bulkDeactivateUsers, 
  bulkDeleteUsers,
  updateUserDetails,
  changeUserPassword,
  updateProfile,
  updateProfileImage,
  removeProfileImage
} = require('../controllers/userController');

const router = express.Router();

// Admin: list users with stats
router.get('/admin/users', isAuthenticated, authorizeRoles('admin'), listUsersWithStats);
router.post('/admin/users/activate', isAuthenticated, authorizeRoles('admin'), bulkActivateUsers);
router.post('/admin/users/deactivate', isAuthenticated, authorizeRoles('admin'), bulkDeactivateUsers);
router.delete('/admin/users', isAuthenticated, authorizeRoles('admin'), bulkDeleteUsers);

// Admin: Update user details and change password
router.put('/admin/users/:id', isAuthenticated, authorizeRoles('admin'), updateUserDetails);
router.put('/admin/users/:id/change-password', isAuthenticated, authorizeRoles('admin'), changeUserPassword);

// Admin Profile Management
router.put('/admin/profile', isAuthenticated, authorizeRoles('admin'), updateProfile);
router.put('/admin/profile/image', isAuthenticated, authorizeRoles('admin'), uploadSingle, updateProfileImage);
router.delete('/admin/profile/image', isAuthenticated, authorizeRoles('admin'), removeProfileImage);

module.exports = router;


