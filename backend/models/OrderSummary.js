const mongoose = require('mongoose');

const orderSummarySchema = new mongoose.Schema({
  giftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SurpriseGift',
    required: true
  },
  productSKU: {
    type: String,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  retailPrice: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0
  },
  profit: {
    type: Number,
    required: true
  },
  totalProfit: {
    type: Number,
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['order', 'orders', 'surprisegift', 'collaborative'],
    default: 'orders'
  }
}, {
  timestamps: true
});

// Index for better query performance
orderSummarySchema.index({ giftId: 1 });
orderSummarySchema.index({ productId: 1 });
orderSummarySchema.index({ orderDate: -1 });

module.exports = mongoose.model('OrderSummary', orderSummarySchema);