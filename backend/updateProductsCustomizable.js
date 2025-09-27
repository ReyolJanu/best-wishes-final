const mongoose = require("mongoose");
const Product = require("./models/Product");
require("dotenv").config();

const updateProductsToCustomizable = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // First, let's see what products exist
    const allProducts = await Product.find({}).select('name mainCategory tags isCustomizable customizationType');
    console.log("Current products:");
    allProducts.forEach(p => {
      console.log(`- ${p.name} | Category: ${p.mainCategory} | Customizable: ${p.isCustomizable || false} | Type: ${p.customizationType || 'none'}`);
    });

    console.log("\n--- Updating Products ---");

    // Update mugs to be customizable
    const mugUpdate = await Product.updateMany(
      { 
        $or: [
          { name: { $regex: /mug/i } },
          { mainCategory: { $regex: /mug/i } },
          { tags: { $in: ["mug", "mugs"] } }
        ]
      },
      { 
        $set: { 
          isCustomizable: true,
          customizationType: "mug",
          customizationPrice: 5.00
        } 
      }
    );
    console.log(`✅ Updated ${mugUpdate.modifiedCount} mugs to be customizable`);

    // Update cards to be customizable
    const cardUpdate = await Product.updateMany(
      { 
        $or: [
          { name: { $regex: /card/i } },
          { mainCategory: { $regex: /card/i } },
          { tags: { $in: ["card", "cards", "greeting"] } }
        ]
      },
      { 
        $set: { 
          isCustomizable: true,
          customizationType: "birthday-card",
          customizationPrice: 3.00
        } 
      }
    );
    console.log(`✅ Updated ${cardUpdate.modifiedCount} cards to be customizable`);

    // Update birthday-related products
    const birthdayUpdate = await Product.updateMany(
      { 
        $or: [
          { name: { $regex: /birthday/i } },
          { tags: { $in: ["birthday"] } }
        ]
      },
      { 
        $set: { 
          isCustomizable: true,
          customizationType: "birthday-card",
          customizationPrice: 3.00
        } 
      }
    );
    console.log(`✅ Updated ${birthdayUpdate.modifiedCount} birthday items to be customizable`);

    // Update anniversary products
    const anniversaryUpdate = await Product.updateMany(
      { 
        $or: [
          { name: { $regex: /anniversary/i } },
          { tags: { $in: ["anniversary"] } }
        ]
      },
      { 
        $set: { 
          isCustomizable: true,
          customizationType: "anniversary-card",
          customizationPrice: 3.00
        } 
      }
    );
    console.log(`✅ Updated ${anniversaryUpdate.modifiedCount} anniversary items to be customizable`);

    // Show updated products
    console.log("\n--- Updated Products ---");
    const updatedProducts = await Product.find({ isCustomizable: true }).select('name mainCategory customizationType customizationPrice _id');
    updatedProducts.forEach(p => {
      console.log(`✨ ${p.name} | Type: ${p.customizationType} | Price: +£${p.customizationPrice}`);
      console.log(`   🔗 http://localhost:3000/productDetail/${p._id}`);
    });

    if (updatedProducts.length === 0) {
      console.log("⚠️  No products were made customizable. Let me create a test product...");
      
      // Create a simple test product
      const testProduct = await Product.create({
        name: "Test Customizable Mug",
        sku: "TEST-MUG-001",
        shortDescription: "A test mug for customization",
        mainCategory: "Mugs",
        retailPrice: 10.00,
        stock: 10,
        status: "active",
        isCustomizable: true,
        customizationType: "mug",
        customizationPrice: 5.00,
        images: [{ url: "/placeholder.svg" }]
      });
      
      console.log(`✅ Created test product: http://localhost:3000/productDetail/${testProduct._id}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

updateProductsToCustomizable();