// const express = require('express');
// const router = express.Router();
// const { addProduct, getAllProducts } = require('../controllers/productController');
// const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');

// router.route('/addProduct').post(isAuthenticated, authorizeRoles('admin'), addProduct);
// router.route('/getAllProducts').get(getAllProducts);


// module.exports = router;
// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  reduceStock,
} = require("../controllers/productController");
const { validateProduct } = require("../middleware/validation");
const { isAuthenticated, authorizeRoles } = require("../middleware/authMiddleware");

// Test route to check if products exist
router.get("/test", async (req, res) => {
  const Product = require("../models/Product");
  try {
    const count = await Product.countDocuments();
    const sampleProducts = await Product.find().limit(3).select('_id name stock');
    res.json({
      success: true,
      message: "Product routes working",
      totalProducts: count,
      sampleProducts: sampleProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error testing products",
      error: error.message
    });
  }
});

// Public routes (no authentication required)
router.get("/", getAllProducts);
router.get("/filter", getAllProducts);
router.get("/:id", getProduct);

// Protected routes for admin and inventory manager
router.put("/reduce-stock", isAuthenticated, authorizeRoles('admin', 'inventoryManager'), reduceStock);
router.post("/", isAuthenticated, authorizeRoles('admin', 'inventoryManager'), validateProduct, createProduct);
router.put("/:id", isAuthenticated, authorizeRoles('admin', 'inventoryManager'), validateProduct, updateProduct);
router.delete("/:id", isAuthenticated, authorizeRoles('admin', 'inventoryManager'), deleteProduct);

module.exports = router;
