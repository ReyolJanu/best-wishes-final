// sendEmail.js
const nodemailer = require('nodemailer');

exports.Emailhandler = async function (req, res) {
  console.log('Email handler called with method:', req.method);
  console.log('Request body:', req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { to, subject, text, html } = req.body;
  console.log('Email parameters:', { to, subject, hasText: !!text, hasHtml: !!html });

  if (!to || !subject || (!text && !html)) {
    console.log('Missing required fields');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('Creating transporter with email:', process.env.EMAIL);
    console.log('Email app password set:', !!process.env.EMAIL_APP_PASSWORD);
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"BEST WISHES" <${process.env.EMAIL}>`,
      to,
      subject,
      text,
      html,
    };

    console.log('Sending email with options:', { 
      from: mailOptions.from, 
      to: mailOptions.to, 
      subject: mailOptions.subject 
    });
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Detailed email send error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    return res.status(500).json({ success: false, error: 'Email not sent', details: error.message });
  }
};