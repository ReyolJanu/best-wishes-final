// Script to make existing products customizable
// Run this in MongoDB or create a script to update your products

// Example: Make mugs customizable
db.products.updateMany(
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
      customizationPrice: 5.00  // Additional £5 for customization
    } 
  }
);

// Example: Make birthday cards customizable
db.products.updateMany(
  { 
    $or: [
      { name: { $regex: /birthday.*card/i } },
      { mainCategory: { $regex: /card/i } },
      { tags: { $in: ["birthday", "card", "greeting"] } }
    ]
  },
  { 
    $set: { 
      isCustomizable: true,
      customizationType: "birthday-card",
      customizationPrice: 3.00  // Additional £3 for customization
    } 
  }
);

// Example: Make anniversary cards customizable
db.products.updateMany(
  { 
    $or: [
      { name: { $regex: /anniversary.*card/i } },
      { tags: { $in: ["anniversary", "card"] } }
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