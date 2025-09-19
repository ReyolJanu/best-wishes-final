// // controllers/productController.js
// const Product = require("../models/Product");



// // addProduct.js - admin only
// exports.addProduct = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       mainCategory,
//       facets,
//       price,
//       imageUrls,
//       stock,
//       rating,
//       isAvailable,
//       rentType,
//     } = req.body;

//     if (
//       !title ||
//       !description ||
//       !mainCategory ||
//       !price ||
//       !imageUrls ||
//       !Array.isArray(imageUrls) ||
//       imageUrls.length === 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Please fill all required fields",
//       });
//     }

//     const product = await Product.create({
//       title,
//       description,
//       mainCategory,
//       facets,
//       price,
//       imageUrls,
//       stock,
//       rating,
//       isAvailable,
//       rentType,
//       owner: req.user._id, // ensure req.user is set from middleware
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Product created successfully",
//       product,
//     });
//   } catch (error) {
//     console.error("Add Product Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while creating product",
//       error: error.message,
//     });
//   }
// };



// // get single Product
// exports.getProduct = async (req, res) =>{
//      try {
//     const productId = req.params.id;  

//     const product = await Product.findById(productId);

//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }
//     res.status(200).json(product);  // Send the product data as JSON
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }

// }

// // Get all products
// exports.getAllProducts = async (req, res) => {
//   try {
//     const products = await Product.find().limit(10); // Fetch all products from the DB

//     if (products.length === 0) {
//       return res.status(404).json({ message: 'No products found' });
//     }

//     res.status(200).json(products); // Send all products as JSON
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// controllers/productController.js
const Product = require("../models/Product");
const { validationResult } = require("express-validator");

// Get N random products (optionally within a category)
exports.getRandomProducts = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit, 10);
    if (Number.isNaN(limit) || limit <= 0) limit = 2;
    if (limit > 20) limit = 20; // safety cap

    const match = {};
    const { category, status } = req.query;
    if (category) match.mainCategory = { $regex: `^${category}$`, $options: 'i' };
    if (status) match.status = status;

    const pipeline = [];
    if (Object.keys(match).length > 0) pipeline.push({ $match: match });
    pipeline.push({ $sample: { size: limit } });

    const products = await Product.aggregate(pipeline);
    return res.json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching random products', error: error.message });
  }
};

// Get random products per category (e.g., 2 for every category)
exports.getRandomByCategory = async (req, res) => {
  try {
    let per = parseInt(req.query.per, 10);
    if (Number.isNaN(per) || per <= 0) per = 2;
    if (per > 10) per = 10; // safety cap

    const match = {};
    const { status } = req.query;
    if (status) match.status = status;

    const pipeline = [];
    if (Object.keys(match).length) pipeline.push({ $match: match });
    // randomize, then take first `per` per category
    pipeline.push(
      { $addFields: { _rand: { $rand: {} } } },
      { $sort: { _rand: 1 } },
      {
        $group: {
          _id: "$mainCategory",
          products: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          products: { $slice: ["$products", per] }
        }
      }
    );

    const results = await Product.aggregate(pipeline);
    return res.json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching random products per category', error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      ...attributes
    } = req.query;

    const query = {};
    if (search) {
      // Use regex search for elastic behavior
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
        { detailedDescription: { $regex: search, $options: "i" } },
        { mainCategory: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }
    if (category) query.mainCategory = { $regex: `^${category}$`, $options: "i" };
    if (status) query.status = status;

    // Add attribute filters to the query
    Object.keys(attributes).forEach(key => {
      if (key.startsWith('attributes.')) {
        const attributeKey = key.replace('attributes.', 'filters.');
        const values = Array.isArray(attributes[key]) ? attributes[key] : attributes[key].split(',');
        query[attributeKey] = { $in: values };
      }
    });

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const products = await Product.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { sku } = req.body;
    if (!sku) {
      return res.status(400).json({ success: false, message: "SKU is required" });
    }

    const existing = await Product.findOne({ sku: sku.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "SKU already exists" });
    }

    const product = new Product({ ...req.body, sku: sku.toUpperCase() });
    await product.save();

    res.status(201).json({ success: true, message: "Product created", data: product });
  } catch (error) {
    console.error(" Error in createProduct:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    console.log(" Updating product:", req.params.id);
    console.log(" Request body:", req.body);
    console.log(" Category and Filters in request:", {
      mainCategory: req.body.mainCategory,
      filters: req.body.filters,
      filtersKeys: Object.keys(req.body.filters || {}),
      filtersValues: Object.values(req.body.filters || {})
    });

    const update = { ...req.body, sku: req.body.sku.toUpperCase() };
    console.log(" Final update object:", update);
    
    const updated = await Product.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    console.log(" Updated product:", updated);
    res.json({ success: true, message: "Product updated", data: updated });
  } catch (error) {
    console.error(" Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// New function to reduce product stock when order is accepted
exports.reduceStock = async (req, res) => {
  try {
    console.log("Reduce stock request body:", req.body);
    
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required and cannot be empty"
      });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`Validating item ${i}:`, item);
      
      if (!item.productId || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Invalid item at index ${i}: productId and quantity are required`
        });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity at index ${i}: quantity must be greater than 0`
        });
      }

      // Check if productId is a valid MongoDB ObjectId
      if (!item.productId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log(`Invalid ObjectId at index ${i}:`, item.productId);
        return res.status(400).json({
          success: false,
          message: `Invalid product ID at index ${i}: must be a valid MongoDB ObjectId`
        });
      }
    }

    const stockUpdates = [];
    const insufficientStockItems = [];

    // Start a transaction to ensure atomic operations
    const session = await Product.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Check stock availability for all items first
        for (const item of items) {
          const { productId, quantity } = item;
          console.log(`Processing product ${productId} with quantity ${quantity}`);

          const product = await Product.findById(productId).session(session);
          
          if (!product) {
            throw new Error(`Product not found: ${productId}`);
          }

          console.log(`Found product: ${product.name}, current stock: ${product.stock}`);

          // Check if sufficient stock is available
          if (product.stock < quantity) {
            insufficientStockItems.push({
              productId: productId,
              productName: product.name,
              requestedQuantity: quantity,
              availableStock: product.stock
            });
            continue;
          }

          stockUpdates.push({
            productId: productId,
            productName: product.name,
            oldStock: product.stock,
            newStock: product.stock - quantity,
            reducedQuantity: quantity
          });
        }

        // If any items have insufficient stock, abort the transaction
        if (insufficientStockItems.length > 0) {
          throw new Error("Insufficient stock for some items");
        }

        // Update stock for all items
        for (const update of stockUpdates) {
          console.log(`Updating stock for ${update.productName}: ${update.oldStock} -> ${update.newStock}`);
          
          const result = await Product.findByIdAndUpdate(
            update.productId,
            { $inc: { stock: -update.reducedQuantity } },
            { session, new: true }
          );

          if (!result) {
            throw new Error(`Failed to update product: ${update.productId}`);
          }

          console.log(`Successfully updated ${update.productName} stock to ${result.stock}`);
        }
      });

      await session.endSession();

      // Return success response
      res.json({
        success: true,
        message: "Stock updated successfully",
        data: {
          updatedItems: stockUpdates,
          totalItemsUpdated: stockUpdates.length
        }
      });

    } catch (transactionError) {
      await session.endSession();
      
      // Check if it's an insufficient stock error
      if (insufficientStockItems.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock for some items",
          data: {
            insufficientStockItems: insufficientStockItems
          }
        });
      }

      throw transactionError;
    }

  } catch (error) {
    console.error("Error reducing product stock:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product stock",
      error: error.message
    });
  }
};
