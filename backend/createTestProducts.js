const mongoose = require("mongoose");
const Product = require("./models/Product");
require("dotenv").config();

const createCustomizableProduct = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Create a test customizable mug
    const customizableMug = await Product.create({
      name: "Custom Birthday Mug",
      sku: "CUSTOM-MUG-001",
      shortDescription: "Personalize this mug with your own message and quotes!",
      detailedDescription: "A high-quality ceramic mug that can be customized with your personal messages, quotes, and wishes. Perfect for birthdays, anniversaries, or any special occasion.",
      mainCategory: "Mugs",
      filters: { material: "ceramic", size: "11oz" },
      tags: ["mug", "customizable", "birthday", "personalized"],
      images: [
        {
          id: "sample1",
          url: "/mug.jpg", // Using existing mug image from public folder
          name: "custom-mug.jpg",
          size: 50000
        }
      ],
      costPrice: 8.00,
      retailPrice: 15.00,
      salePrice: 12.00,
      stock: 50,
      weight: 0.3,
      dimensions: { length: 10, width: 8, height: 9 },
      status: "active",
      featured: true,
      
      // Customization fields
      isCustomizable: true,
      customizationType: "mug",
      customizationPrice: 5.00,
      
      rating: 4.5
    });

    console.log("✅ Created customizable mug:", customizableMug.name);

    // Create a test customizable birthday card
    const customizableCard = await Product.create({
      name: "Personalized Birthday Card",
      sku: "CUSTOM-CARD-001", 
      shortDescription: "Create a unique birthday card with custom messages and beautiful quotes!",
      detailedDescription: "A premium birthday card that you can personalize with heartfelt messages, inspiring quotes, and custom styling. Make someone's special day even more memorable.",
      mainCategory: "Cards",
      filters: { type: "greeting", occasion: "birthday" },
      tags: ["card", "birthday", "customizable", "personalized", "greeting"],
      images: [
        {
          id: "sample2", 
          url: "/birthday-invitation.svg", // Using existing birthday image from public folder
          name: "custom-birthday-card.jpg",
          size: 30000
        }
      ],
      costPrice: 2.00,
      retailPrice: 8.00,
      salePrice: 6.00,
      stock: 100,
      weight: 0.05,
      dimensions: { length: 15, width: 10, height: 0.3 },
      status: "active", 
      featured: true,
      
      // Customization fields
      isCustomizable: true,
      customizationType: "birthday-card",
      customizationPrice: 3.00,
      
      rating: 4.8
    });

    console.log("✅ Created customizable birthday card:", customizableCard.name);
    
    console.log("\n🎉 Test products created! You should now see customize buttons on:");
    console.log(`📍 Mug: http://localhost:3000/productDetail/${customizableMug._id}`);
    console.log(`📍 Card: http://localhost:3000/productDetail/${customizableCard._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating test products:", error);
    process.exit(1);
  }
};

createCustomizableProduct();