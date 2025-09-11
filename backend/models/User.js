const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },

  lastName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false 
  },

  phone: {
    type: String
  },

  address: {
    type: String
  },

  role: {
    type: String,
    enum: ["user", "admin", "inventoryManager", "deliveryStaff"],
    default: "user"
  },

  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  isBlocked: {
    type: Boolean,
    default: false
  },

  profileImage: {
    type: String,
    default: ""
  }

}, { timestamps: true });

// lastLogin: updated at successful login
userSchema.add({
  lastLogin: { type: Date },
  lastActiveAt: { type: Date },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
