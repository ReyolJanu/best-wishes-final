const EventReminder = require('../models/EventReminder');
const { sendEmail } = require('../config/emailConfig');
require('dotenv').config();



async function checkAndSendReminders() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const currentTime = now.toTimeString().slice(0, 5);  // HH:MM

  try {
    const reminders = await EventReminder.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      time: currentTime,
      sent: { $ne: true },
    }).populate('user');

    for (const reminder of reminders) {
    await sendEmail({
      to: reminder.user.email,
      subject: `⏰ Reminder for: ${reminder.event}`,
      html: `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background-color: #6a1b9a; padding: 20px; color: white; text-align: center;">
          <h2 style="margin: 0;">Best Wishes - Event Reminder</h2>
        </div>
        <div style="padding: 30px; color: #333;">
          <p style="font-size: 16px;">Hi <strong>${reminder.user.firstName}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.6;">This is a friendly reminder for your upcoming event:</p>
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
          <p style="margin-top: 30px; font-size: 14px;">Thank you for choosing <strong>Best Wishes</strong>. We’re always here to help make your moments more memorable!</p>
        </div>
        <div style="background-color: #f3e5f5; text-align: center; padding: 15px; font-size: 13px; color: #666;">
          © ${new Date().getFullYear()} Best Wishes. All rights reserved.
        </div>
      </div>
    </div>
  `,
    });

      reminder.sent = true;
      await reminder.save();

      console.log(`✅ Reminder email sent to ${reminder.user.email}`);
    }
  } catch (error) {
    console.error('❌ Error sending reminders:', error.message);
  }
}

// Run every minute
setInterval(checkAndSendReminders, 60 * 1000);
