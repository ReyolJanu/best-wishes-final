const mongoose = require("mongoose");
const Product = require("./models/Product");
require("dotenv").config();

const updateTestProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Update the custom mug with proper image
    const updatedMug = await Product.findOneAndUpdate(
      { name: "Custom Birthday Mug" },
      {
        $set: {
          "images": [
            {
              id: "mug1",
              url: "/mug.jpg",
              name: "custom-mug.jpg",
              size: 50000
            }
          ]
        }
      },
      { new: true }
    );

    if (updatedMug) {
      console.log("✅ Updated custom mug images");
    }

    // Update the custom card with proper image
    const updatedCard = await Product.findOneAndUpdate(
      { name: "Personalized Birthday Card" },
      {
        $set: {
          "images": [
            {
              id: "card1",
              url: "/birthday-invitation.svg",
              name: "custom-birthday-card.svg",
              size: 30000
            }
          ]
        }
      },
      { new: true }
    );

    if (updatedCard) {
      console.log("✅ Updated custom card images");
    }

    console.log("\n🎉 Test products updated with proper images!");
    console.log("The Next.js image error should now be resolved.");
    
    process.exit(0);
  } catch (error) {
    console.error("Error updating test products:", error);
    process.exit(1);
  }
};

updateTestProducts();