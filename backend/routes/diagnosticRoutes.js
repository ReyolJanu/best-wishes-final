// Email diagnostic endpoint for testing on Railway
const express = require('express');
const router = express.Router();

// Diagnostic endpoint to check email configuration
router.get('/email-diagnostic', (req, res) => {
  try {
    const diagnostic = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      emailConfig: {
        hasEmail: !!process.env.EMAIL,
        hasPassword: !!process.env.EMAIL_APP_PASSWORD,
        emailUser: process.env.EMAIL ? process.env.EMAIL.substring(0, 5) + '***' : 'not set',
        passwordLength: process.env.EMAIL_APP_PASSWORD ? process.env.EMAIL_APP_PASSWORD.length : 0
      },
      server: {
        port: process.env.PORT || 'not set',
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    res.status(200).json({
      success: true,
      message: 'Email diagnostic complete',
      data: diagnostic
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Diagnostic failed',
      message: error.message
    });
  }
});

// Simple email test endpoint
router.post('/test-email', async (req, res) => {
  try {
    const { sendEmail } = require('../config/emailConfig');
    
    await sendEmail({
      to: process.env.EMAIL, // Send to self
      subject: 'Railway Email Test',
      text: 'This is a test email from Railway deployment.',
      html: '<p>This is a test email from Railway deployment.</p>'
    });

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test email failed',
      message: error.message
    });
  }
});

module.exports = router;