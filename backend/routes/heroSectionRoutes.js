const express = require('express');
const router = express.Router();
const {
  getAllHeroSections,
  getActiveHeroSections,
  createHeroSection,
  updateHeroSection,
  deleteHeroSection,
  toggleHeroSectionStatus
} = require('../controllers/heroSectionController');
const { upload } = require('../middleware/uploadMiddleware');
// const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');

// Public routes - using /hero-sections prefix
router.get('/hero-sections/active', getActiveHeroSections);

// Admin routes (temporarily without authentication for testing)
router.get('/hero-sections', getAllHeroSections);
router.post('/hero-sections', upload.single('image'), createHeroSection);
router.put('/hero-sections/:id', upload.single('image'), updateHeroSection);
router.delete('/hero-sections/:id', deleteHeroSection);
router.patch('/hero-sections/:id/toggle-status', toggleHeroSectionStatus);

module.exports = router;
