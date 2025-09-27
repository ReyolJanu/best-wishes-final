const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  image: String,
  customization: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customization' },
    selectedQuote: {
      id: String,
      text: String,
      category: String
    },
    customMessage: String,
    fontStyle: String,
    fontSize: Number,
    fontColor: String,
    previewImage: String,
    specialInstructions: String
  }
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  subtotal: { type: Number }, // Items total before shipping
  shippingCost: { type: Number, default: 0 }, // Shipping cost
  total: { type: Number, required: true }, // Final total including shipping
  status: { type: String, enum: ['Pending', 'Processing', 'Packing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  orderedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  statusHistory: [statusHistorySchema],
  deliveryNotes: { type: String, default: '' },
  trackingNumber: { type: String, default: '' },
  deliveryStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveredAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
