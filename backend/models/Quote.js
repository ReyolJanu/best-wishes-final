const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 200
  },
  category: {
    type: String,
    enum: [
      "birthday", 
      "anniversary", 
      "love", 
      "friendship", 
      "motivational", 
      "funny", 
      "general",
      "congratulations",
      "thank-you"
    ],
    required: true
  },
  type: {
    type: String,
    enum: ["mug", "card", "both"],
    default: "both"
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});

// Index for better search performance
quoteSchema.index({ category: 1, type: 1, isActive: 1 });
quoteSchema.index({ text: 'text' });

// Method to increment usage count
quoteSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

module.exports = mongoose.model("Quote", quoteSchema);