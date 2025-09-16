const express = require('express');
const { sendReportEmail } = require('../controllers/reportController');

const router = express.Router();

// Route to send analytics report via email
router.post('/send-report-email', sendReportEmail);

module.exports = router;