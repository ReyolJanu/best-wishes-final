const mongoose = require('mongoose');

const eventReminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remindermsg: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  event: {
    type: String,
    required: true
  },
  occasion: {
    type: String,
    required: true,
    enum: [
      'birthday',
      'anniversary',
      'wedding',
      'graduation',
      'baby_shower',
      'housewarming',
      'valentine_day',
      'mother_day',
      'father_day',
      'christmas',
      'new_year',
      'thanksgiving',
      'engagement',
      'retirement',
      'promotion',
      'get_well_soon',
      'sympathy',
      'congratulations',
      'thank_you',
      'general'
    ]
  },
  time: {
    type: String,
    required: true
  },
  sent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('EventReminder', eventReminderSchema);
