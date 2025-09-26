const express = require('express');
const { createReminder, getUserReminders, updateReminder, deleteReminder, getOccasionTypes } = require('../controllers/eventController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/reminder', isAuthenticated, createReminder);
router.get('/reminder', isAuthenticated, getUserReminders);
router.put('/reminder/:id', isAuthenticated, updateReminder);
router.delete('/reminder/:id', isAuthenticated, deleteReminder);
router.get('/occasion-types', getOccasionTypes);

module.exports = router;
