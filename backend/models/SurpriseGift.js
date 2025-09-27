const mongoose = require('mongoose');

const surpriseGiftItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  image: String,
});

const surpriseGiftSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientName: { type: String, required: true },
  recipientPhone: { type: String, required: true },
  shippingAddress: { type: String, required: true },
  costume: { type: String, enum: ['none','mickey','tomjerry','joker'], default: 'none' },
  suggestions: { type: String },
  items: [surpriseGiftItemSchema],
  total: { type: Number, required: true },
  status: { type: String, enum: ['Pending','Confirmed','AwaitingPayment','Paid','Packing','OutForDelivery','Delivered','Cancelled'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['pending','paid','failed'], default: 'pending' },
  paymentId: { type: String },
  scheduledAt: { type: Date },
  packedAt: { type: Date },
  deliveryStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveredAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('SurpriseGift', surpriseGiftSchema);


