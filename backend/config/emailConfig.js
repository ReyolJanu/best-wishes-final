const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a centralized email transporter configuration
const createTransporter = () => {
  // Validate environment variables
  if (!process.env.EMAIL || !process.env.EMAIL_APP_PASSWORD) {
    console.error('❌ EMAIL or EMAIL_APP_PASSWORD environment variables are missing');
    throw new Error('EMAIL and EMAIL_APP_PASSWORD must be set in environment variables');
  }

  // Clean the app password - remove any spaces or special characters
  const cleanPassword = process.env.EMAIL_APP_PASSWORD.replace(/\s/g, '');

  // Enhanced configuration for cloud hosting
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL,
      pass: cleanPassword,
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    debug: false,
    logger: false,
    pool: true,               // Use connection pooling
    maxConnections: 5,        // Max 5 concurrent connections
    maxMessages: 100,         // Max 100 messages per connection
    rateLimit: 14             // Max 14 messages per second
  });

  return transporter;
};

// Function to send email with enhanced error handling for production
const sendEmail = async (mailOptions) => {
  let transporter;
  try {
    // Validate required fields
    if (!mailOptions.to) {
      throw new Error('Email recipient (to) is required');
    }
    if (!mailOptions.subject) {
      throw new Error('Email subject is required');
    }
    if (!mailOptions.text && !mailOptions.html) {
      throw new Error('Email content (text or html) is required');
    }

    transporter = createTransporter();
    
    // Verify connection before sending (only in production)
    if (process.env.NODE_ENV === 'production') {
      try {
        await transporter.verify();
      } catch (verifyError) {
        console.error('❌ SMTP connection verification failed:', verifyError.message);
        throw new Error('Email server connection failed');
      }
    }

    const info = await transporter.sendMail({
      from: `"BEST WISHES" <${process.env.EMAIL}>`,
      ...mailOptions
    });
    
    console.log('✅ Email sent successfully');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    
    // Enhanced error handling for different types of failures
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check app password.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Could not connect to email server. Please try again.');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('Email sending timed out. Please try again.');
    } else {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  } finally {
    // Close transporter connection
    if (transporter) {
      transporter.close();
    }
  }
};

module.exports = {
  createTransporter,
  sendEmail
};