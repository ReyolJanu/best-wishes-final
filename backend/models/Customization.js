const mongoose = require("mongoose");

const customizationSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },
  customizationType: {
    type: String,
    enum: ["mug", "birthday-card", "anniversary-card", "general-card"],
    required: true
  },
  selectedQuote: {
    id: String,
    text: String,
    category: String
  },
  customMessage: {
    type: String,
    maxlength: 500
  },
  fontStyle: {
    type: String,
    default: "Arial"
  },
  fontSize: {
    type: Number,
    default: 14
  },
  fontColor: {
    type: String,
    default: "#000000"
  },
  textPosition: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  backgroundColor: {
    type: String,
    default: "#FFFFFF"
  },
  additionalImages: [{
    id: String,
    url: String,
    name: String,
    position: {
      x: Number,
      y: Number
    }
  }],
  previewImage: {
    type: String // Base64 or URL to the preview image
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["draft", "confirmed", "in-production", "completed", "cancelled"],
    default: "draft"
  },
  specialInstructions: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
customizationSchema.index({ user: 1, createdAt: -1 });
customizationSchema.index({ order: 1 });
customizationSchema.index({ product: 1 });

// Virtual to get the final text (quote + custom message)
customizationSchema.virtual("finalText").get(function() {
  let text = "";
  if (this.selectedQuote && this.selectedQuote.text) {
    text = this.selectedQuote.text;
  }
  if (this.customMessage) {
    text = text ? `${text}\n\n${this.customMessage}` : this.customMessage;
  }
  return text;
});

module.exports = mongoose.model("Customization", customizationSchema);