const mongoose = require("mongoose")

const variantSchema = new mongoose.Schema({
  id: String,
  sku: String,
  attributes: { type: Map, of: String },
  price: Number,
  stock: Number,
  weight: Number,
  enabled: Boolean,
})

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  shortDescription: { type: String, required: true },
  detailedDescription: String,
  mainCategory: { type: String, required: true },
  filters: { type: Object, default: {} },
  tags: [String],
  images: [{ id: String, url: String, name: String, size: Number }],
  videos: [{ id: String, url: String, name: String, size: Number }],
  costPrice: Number,
  retailPrice: Number,
  salePrice: { type: Number, default: 0 },
  taxClass: { type: String, enum: ["standard", "reduced", "zero", "exempt"], default: "standard" },
  stock: Number,
  stockStatus: { type: String, enum: ["in-stock", "low-stock", "out-of-stock", "backordered"], default: "in-stock" },
  weight: Number,
  dimensions: { length: Number, width: Number, height: Number },
  shippingClass: { type: String, enum: ["standard", "express", "overnight", "free", "heavy"], default: "standard" },
  variants: [variantSchema],
  status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
  featured: Boolean,
  seoTitle: String,
  seoDescription: String,
  rating: { type: Number, default: 3 },
  isCustomizable: { type: Boolean, default: false },
  customizationType: { 
    type: String, 
    enum: ["mug", "birthday-card", "anniversary-card", "general-card"],
    required: function() { return this.isCustomizable; }
  },
  customizationPrice: { 
    type: Number, 
    default: 0,
    required: function() { return this.isCustomizable; }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

productSchema.index({ name: 'text', shortDescription: 'text' });

productSchema.virtual("price").get(function () {
  return this.salePrice > 0 ? this.salePrice : this.retailPrice
})

productSchema.virtual("profitMargin").get(function () {
  const sellingPrice = this.salePrice > 0 ? this.salePrice : this.retailPrice
  return this.costPrice > 0 ? (((sellingPrice - this.costPrice) / this.costPrice) * 100).toFixed(2) : 0
})

productSchema.pre("save", function (next) {
  if (this.stock === 0) this.stockStatus = "out-of-stock"
  else if (this.stock <= 10) this.stockStatus = "low-stock"
  else this.stockStatus = "in-stock"

  if (!this.seoTitle) this.seoTitle = this.name.substring(0, 60)
  if (!this.seoDescription) this.seoDescription = this.shortDescription
  next()
})

 
module.exports = mongoose.model("Product", productSchema)