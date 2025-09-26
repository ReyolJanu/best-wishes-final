const EventReminder = require('../models/EventReminder');
const sendReminderEmail = require('../utils/reminderMail');
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
      try {
        // Use the enhanced reminder email function that includes product recommendations
        await sendReminderEmail(reminder.user, reminder);
        
        reminder.sent = true;
        await reminder.save();

        console.log(`✅ Enhanced reminder email with product recommendations sent to ${reminder.user.email} for ${reminder.event} (${reminder.occasion || 'general'})`);
      } catch (emailError) {
        console.error(`❌ Failed to send reminder email to ${reminder.user.email}:`, emailError.message);
      }
    }
    
    if (reminders.length > 0) {
      console.log(`📧 Processed ${reminders.length} reminder(s) at ${now.toLocaleString()}`);
    }
  } catch (error) {
    console.error('❌ Error checking reminders:', error.message);
  }
}

// Run every minute
console.log('🔄 Reminder scheduler started - checking every minute for due reminders...');
setInterval(checkAndSendReminders, 60 * 1000);

module.exports = { checkAndSendReminders };