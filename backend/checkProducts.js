const mongoose = require("mongoose");
const Product = require("./models/Product");
require("dotenv").config();

const checkProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all customizable products
    const customizableProducts = await Product.find({ isCustomizable: true });
    
    console.log("\n📋 Current customizable products:");
    customizableProducts.forEach(product => {
      console.log(`ID: ${product._id}`);
      console.log(`Name: ${product.name}`);
      console.log(`Image URL: ${product.images[0]?.url || 'No image'}`);
      console.log(`Customizable: ${product.isCustomizable}`);
      console.log("---");
    });

    // Delete products with placeholder images
    const productsToDelete = await Product.find({
      isCustomizable: true,
      "images.url": { $regex: "via.placeholder.com" }
    });

    if (productsToDelete.length > 0) {
      console.log(`\n🗑️ Deleting ${productsToDelete.length} products with placeholder images...`);
      await Product.deleteMany({
        isCustomizable: true,
        "images.url": { $regex: "via.placeholder.com" }
      });
      console.log("✅ Old products deleted!");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkProducts();