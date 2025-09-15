// sendEmail.js
const { sendEmail } = require("../config/emailConfig");
require("dotenv").config();

exports.Emailhandler = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const { to, subject, text, html } = req.body;

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ 
      success: false,
      message: "Missing required fields",
      details: "Email recipient, subject, and content (text or html) are required"
    });
  }

  try {
    const result = await sendEmail({
      to,
      subject,
      text,
      html,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: result.messageId
    });
  } catch (error) {
    console.error('❌ Email handler error:', error.message);
    
    return res.status(500).json({
      success: false,
      error: "Email sending failed",
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
