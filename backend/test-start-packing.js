// Test script to verify the Start Packing functionality
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Product = require('./models/Product');
const OrderSummary = require('./models/OrderSummary');

// Test the start packing functionality
async function testStartPacking() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/best-wishes', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Find a processing order
    const processingOrder = await Order.findOne({ status: 'Processing' })
      .populate('items.product', 'name sku stock costPrice retailPrice salePrice');

    if (!processingOrder) {
      console.log('❌ No processing orders found. Create a processing order first.');
      return;
    }

    console.log('📦 Found processing order:', processingOrder._id);
    console.log('📋 Order items:', processingOrder.items.map(item => ({
      name: item.product?.name,
      quantity: item.quantity,
      currentStock: item.product?.stock
    })));

    // Check if we can process this order
    let canProcess = true;
    const stockIssues = [];

    for (const item of processingOrder.items) {
      if (!item.product) {
        stockIssues.push(`Product not found for item: ${item.name}`);
        canProcess = false;
        continue;
      }

      const availableStock = item.product.stock || 0;
      if (availableStock < item.quantity) {
        stockIssues.push(`Insufficient stock for ${item.product.name}: need ${item.quantity}, have ${availableStock}`);
        canProcess = false;
      }
    }

    if (!canProcess) {
      console.log('❌ Cannot process order due to stock issues:');
      stockIssues.forEach(issue => console.log(`   - ${issue}`));
      return;
    }

    console.log('✅ Order can be processed - all stock requirements met');

    // Simulate the controller logic
    const session = await mongoose.startSession();
    await session.startTransaction();

    try {
      // Create order summary entries
      const orderSummaryEntries = [];
      
      for (const item of processingOrder.items) {
        const product = item.product;
        const salePrice = product.salePrice > 0 ? product.salePrice : product.retailPrice;
        const profit = salePrice - product.costPrice;
        const totalProfit = profit * item.quantity;

        orderSummaryEntries.push({
          giftId: processingOrder._id,
          productSKU: product.sku,
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          costPrice: product.costPrice,
          retailPrice: product.retailPrice,
          salePrice: salePrice,
          profit: profit,
          totalProfit: totalProfit,
          orderDate: processingOrder.orderedAt,
          status: 'orders'
        });

        // Update stock
        await Product.findByIdAndUpdate(
          product._id,
          { 
            $inc: { stock: -item.quantity },
            $set: { 
              stockStatus: (product.stock - item.quantity) <= 0 ? 'out-of-stock' : 
                          (product.stock - item.quantity) <= 5 ? 'low-stock' : 'in-stock'
            }
          },
          { session }
        );
      }

      // Insert order summaries
      await OrderSummary.insertMany(orderSummaryEntries, { session });

      // Update order status
      await Order.findByIdAndUpdate(
        processingOrder._id,
        {
          status: 'Packing',
          $push: {
            statusHistory: {
              status: 'Packing',
              updatedAt: new Date(),
              notes: `Stock reduced and order summary created for ${processingOrder.items.length} products`
            }
          }
        },
        { session }
      );

      await session.commitTransaction();
      console.log('✅ Transaction completed successfully!');
      console.log(`📊 Created ${orderSummaryEntries.length} order summary entries`);
      console.log('📦 Order status updated to Packing');

    } catch (error) {
      await session.abortTransaction();
      console.log('❌ Transaction failed:', error.message);
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testStartPacking();
}

module.exports = testStartPacking;