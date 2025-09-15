const { sendEmail } = require('../config/emailConfig');
const User = require('../models/User');

async function sendReminderEmail(user, reminder) {
  if (!user || !user.email) return;
  
  await sendEmail({
    to: user.email,
    subject: `⏰ Reminder for: ${reminder.event}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background-color: #6a1b9a; padding: 20px; color: white; text-align: center;">
            <h2 style="margin: 0;">Best Wishes - Event Reminder</h2>
          </div>
          <div style="padding: 30px; color: #333;">
            <p style="font-size: 16px;">Hi <strong>${user.firstName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6;">This is a confirmation for your scheduled event reminder:</p>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold;">📌 Event</td>
                <td style="padding: 8px;">${reminder.event}</td>
              </tr>
              <tr style="background-color: #f3e5f5;">
                <td style="padding: 8px; font-weight: bold;">📅 Date</td>
                <td style="padding: 8px;">${reminder.date.toISOString().split('T')[0]}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">⏰ Time</td>
                <td style="padding: 8px;">${reminder.time}</td>
              </tr>
            </table>
            <p style="font-size: 15px;">💬 <em>${reminder.remindermsg}</em></p>
            <p style="margin-top: 30px; font-size: 14px;">Thank you for using <strong>Best Wishes</strong>! You will receive a reminder at the scheduled time.</p>
          </div>
          <div style="background-color: #f3e5f5; text-align: center; padding: 15px; font-size: 13px; color: #666;">
            © ${new Date().getFullYear()} Best Wishes. All rights reserved.
          </div>
        </div>
      </div>
    `,
  });
}

module.exports = sendReminderEmail;
