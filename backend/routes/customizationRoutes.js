const express = require("express");
const {
  getQuotes,
  getQuoteCategories,
  saveCustomization,
  getUserCustomizations,
  getCustomization,
  deleteCustomization,
  getAllCustomizations,
  updateCustomizationStatus,
  getCustomizableProducts
} = require("../controllers/customizationController");
const { isAuthenticated, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/quotes", getQuotes);
router.get("/quotes/categories", getQuoteCategories);
router.get("/products", getCustomizableProducts);

// Protected routes (require authentication)
router.post("/", isAuthenticated, saveCustomization);
router.get("/my-customizations", isAuthenticated, getUserCustomizations);
router.get("/:id", isAuthenticated, getCustomization);
router.delete("/:id", isAuthenticated, deleteCustomization);

// Admin routes
router.get("/admin/all", isAuthenticated, authorizeRoles("admin"), getAllCustomizations);
router.patch("/admin/:id/status", isAuthenticated, authorizeRoles("admin"), updateCustomizationStatus);

module.exports = router;