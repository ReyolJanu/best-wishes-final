const Customization = require("../models/Customization");
const Quote = require("../models/Quote");
const Product = require("../models/Product");
const Order = require("../models/Order");

// Get all quotes by category and type
const getQuotes = async (req, res) => {
  try {
    const { category, type } = req.query;
    
    let filter = { isActive: true };
    if (category) filter.category = category;
    if (type) filter.type = { $in: [type, "both"] };

    const quotes = await Quote.find(filter)
      .sort({ usageCount: -1, createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: quotes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching quotes",
      error: error.message
    });
  }
};

// Get quote categories
const getQuoteCategories = async (req, res) => {
  try {
    const categories = await Quote.distinct("category", { isActive: true });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message
    });
  }
};

// Create or update customization
const saveCustomization = async (req, res) => {
  try {
    const {
      productId,
      customizationType,
      selectedQuote,
      customMessage,
      fontStyle,
      fontSize,
      fontColor,
      textPosition,
      backgroundColor,
      additionalImages,
      previewImage,
      specialInstructions
    } = req.body;

    // Verify product exists and is customizable
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (!product.isCustomizable) {
      return res.status(400).json({
        success: false,
        message: "This product is not customizable"
      });
    }

    // Calculate total price (base product price + customization price)
    const price = product.price + (product.customizationPrice || 0);

    let customization = await Customization.findOne({
      product: productId,
      user: req.user._id,
      status: "draft"
    });

    const customizationData = {
      product: productId,
      user: req.user._id,
      customizationType,
      selectedQuote,
      customMessage,
      fontStyle,
      fontSize,
      fontColor,
      textPosition,
      backgroundColor,
      additionalImages,
      previewImage,
      price,
      specialInstructions
    };

    if (customization) {
      // Update existing draft
      Object.assign(customization, customizationData);
      await customization.save();
    } else {
      // Create new customization
      customization = new Customization(customizationData);
      await customization.save();
    }

    // Increment quote usage count if a quote was selected
    if (selectedQuote && selectedQuote.id) {
      await Quote.findByIdAndUpdate(selectedQuote.id, { $inc: { usageCount: 1 } });
    }

    await customization.populate("product", "name images price");

    res.json({
      success: true,
      message: "Customization saved successfully",
      data: customization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error saving customization",
      error: error.message
    });
  }
};

// Get user's customizations
const getUserCustomizations = async (req, res) => {
  try {
    const { status = "draft" } = req.query;
    
    const customizations = await Customization.find({
      user: req.user._id,
      status
    })
    .populate("product", "name images price")
    .populate("order", "orderNumber status")
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: customizations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching customizations",
      error: error.message
    });
  }
};

// Get single customization
const getCustomization = async (req, res) => {
  try {
    const customization = await Customization.findById(req.params.id)
      .populate("product", "name images price isCustomizable customizationType")
      .populate("user", "firstName lastName email")
      .populate("order", "orderNumber status totalAmount");

    if (!customization) {
      return res.status(404).json({
        success: false,
        message: "Customization not found"
      });
    }

    // Check if user owns this customization or is admin
    if (customization.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    res.json({
      success: true,
      data: customization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching customization",
      error: error.message
    });
  }
};

// Delete customization (only draft status)
const deleteCustomization = async (req, res) => {
  try {
    const customization = await Customization.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "draft"
    });

    if (!customization) {
      return res.status(404).json({
        success: false,
        message: "Customization not found or cannot be deleted"
      });
    }

    await customization.deleteOne();

    res.json({
      success: true,
      message: "Customization deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting customization",
      error: error.message
    });
  }
};

// Admin: Get all customizations
const getAllCustomizations = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      customizationType,
      search 
    } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (customizationType) filter.customizationType = customizationType;

    const customizations = await Customization.find(filter)
      .populate("product", "name images")
      .populate("user", "firstName lastName email")
      .populate("order", "orderNumber status")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customization.countDocuments(filter);

    res.json({
      success: true,
      data: customizations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching customizations",
      error: error.message
    });
  }
};

// Admin: Update customization status
const updateCustomizationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!["draft", "confirmed", "in-production", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const customization = await Customization.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("product", "name images")
     .populate("user", "firstName lastName email");

    if (!customization) {
      return res.status(404).json({
        success: false,
        message: "Customization not found"
      });
    }

    res.json({
      success: true,
      message: "Customization status updated successfully",
      data: customization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating customization status",
      error: error.message
    });
  }
};

// Get customizable products
const getCustomizableProducts = async (req, res) => {
  try {
    const { type } = req.query;
    
    let filter = { 
      isCustomizable: true, 
      status: "active",
      stockStatus: { $ne: "out-of-stock" }
    };
    
    if (type) {
      filter.customizationType = type;
    }

    const products = await Product.find(filter)
      .select("name images price salePrice retailPrice customizationPrice customizationType shortDescription")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching customizable products",
      error: error.message
    });
  }
};

module.exports = {
  getQuotes,
  getQuoteCategories,
  saveCustomization,
  getUserCustomizations,
  getCustomization,
  deleteCustomization,
  getAllCustomizations,
  updateCustomizationStatus,
  getCustomizableProducts
};