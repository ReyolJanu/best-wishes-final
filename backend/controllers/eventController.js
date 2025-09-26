
const EventReminder = require('../models/EventReminder');
const User = require('../models/User');
const sendReminderEmail = require('../utils/reminderMail');
const { getOccasionTypes } = require('../utils/productRecommendation');

exports.createReminder = async (req, res) => {
  try {
    const { remindermsg, date, event, time, occasion } = req.body;
    if (!remindermsg || !date || !event || !time || !occasion) {
      return res.status(400).json({ success: false, message: 'All fields including occasion are required.' });
    }
    
    const reminder = await EventReminder.create({
      user: req.user.id,
      remindermsg,
      date,
      event,
      time,
      occasion
    });

    res.status(201).json({ success: true, message: 'Reminder Set Successfully', reminder });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong', error: err.message });
  }
};

// Get available occasion types for dropdown
exports.getOccasionTypes = async (req, res) => {
  try {
    const occasionTypes = getOccasionTypes();
    res.status(200).json({ success: true, occasionTypes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch occasion types', error: err.message });
  }
};

// Get all reminders for the logged-in user
exports.getUserReminders = async (req, res) => {
  try {
    const reminders = await EventReminder.find({ user: req.user.id }).sort({ date: -1, time: -1 });
    res.status(200).json({ success: true, reminders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reminders', error: err.message });
  }
};

// Update a reminder by ID (only if it belongs to the user)
exports.updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { remindermsg, date, event, time, occasion } = req.body;
    const reminder = await EventReminder.findOne({ _id: id, user: req.user.id });
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    reminder.remindermsg = remindermsg || reminder.remindermsg;
    reminder.date = date || reminder.date;
    reminder.event = event || reminder.event;
    reminder.time = time || reminder.time;
    reminder.occasion = occasion || reminder.occasion;
    await reminder.save();
    res.status(200).json({ success: true, message: 'Reminder updated successfully', reminder });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update reminder', error: err.message });
  }
};

// Delete a reminder by ID (only if it belongs to the user)
exports.deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await EventReminder.findOneAndDelete({ _id: id, user: req.user.id });
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.status(200).json({ success: true, message: 'Reminder deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete reminder', error: err.message });
  }
};
