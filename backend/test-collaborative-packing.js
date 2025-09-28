const mongoose = require('mongoose');
const CollaborativePurchase = require('./models/CollaborativePurchase');
const Product = require('./models/Product');
const OrderSummary = require('./models/OrderSummary');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/best-wishes');

async function testCollaborativePacking() {
  try {
    console.log('🔍 Testing collaborative purchase packing functionality...\n');

    // 1. Find a collaborative purchase with status 'pending'
    const pendingPurchase = await CollaborativePurchase.findOne({ status: 'pending' })
      .populate('products.product')
      .populate('product');

    if (!pendingPurchase) {
      console.log('❌ No pending collaborative purchases found for testing');
      console.log('📝 Creating a test collaborative purchase...');
      
      // Create a test product if none exists
      let testProduct = await Product.findOne({ name: { $regex: /test/i } });
      if (!testProduct) {
        testProduct = new Product({
          name: 'Test Collaborative Product',
          sku: 'TEST-COLLAB-001',
          shortDescription: 'Test product for collaborative purchase',
          mainCategory: 'Test',
          costPrice: 10,
          retailPrice: 20,
          salePrice: 15,
          stock: 100,
          status: 'active'
        });
        await testProduct.save();
        console.log('✅ Test product created:', testProduct.name);
      }

      // Create a test user (assuming admin user exists)
      const testUser = await mongoose.connection.db.collection('users').findOne({ role: 'admin' });
      if (!testUser) {
        console.log('❌ No admin user found for testing');
        return;
      }

      // Create test collaborative purchase
      const testPurchase = new CollaborativePurchase({
        product: testProduct._id,
        productName: testProduct.name,
        productPrice: testProduct.salePrice,
        quantity: 2,
        totalAmount: testProduct.salePrice * 2,
        shareAmount: (testProduct.salePrice * 2) / 2,
        createdBy: testUser._id,
        participants: [
          {
            email: 'participant1@test.com',
            paymentStatus: 'paid',
            paymentLink: 'test-link-1',
            paidAt: new Date()
          },
          {
            email: 'participant2@test.com',
            paymentStatus: 'paid',
            paymentLink: 'test-link-2',
            paidAt: new Date()
          }
        ],
        status: 'pending',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      });

      await testPurchase.save();
      console.log('✅ Test collaborative purchase created:', testPurchase._id);
      
      // Re-fetch with populated data
      const populatedPurchase = await CollaborativePurchase.findById(testPurchase._id)
        .populate('product');
      
      await testPackingProcess(populatedPurchase);
    } else {
      console.log('✅ Found pending collaborative purchase:', pendingPurchase._id);
      await testPackingProcess(pendingPurchase);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Test completed, database connection closed');
  }
}

async function testPackingProcess(collaborativePurchase) {
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();
    
    console.log('\n📦 Testing packing process for:', collaborativePurchase._id);
    console.log('Current status:', collaborativePurchase.status);
    
    // Prepare items to process
    const itemsToProcess = [];
    
    if (collaborativePurchase.isMultiProduct && collaborativePurchase.products && collaborativePurchase.products.length > 0) {
      console.log('🔄 Processing multi-product purchase...');
      for (const productItem of collaborativePurchase.products) {
        itemsToProcess.push({
          productId: productItem.product._id,
          productName: productItem.productName,
          quantity: productItem.quantity,
          productData: productItem.product,
          price: productItem.productPrice
        });
      }
    } else if (collaborativePurchase.product) {
      console.log('🔄 Processing single-product purchase...');
      itemsToProcess.push({
        productId: collaborativePurchase.product._id,
        productName: collaborativePurchase.productName,
        quantity: collaborativePurchase.quantity,
        productData: collaborativePurchase.product,
        price: collaborativePurchase.productPrice
      });
    }

    console.log('Items to process:', itemsToProcess.length);

    // Check stock availability
    console.log('\n📊 Checking stock availability...');
    for (const item of itemsToProcess) {
      const currentStock = item.productData.stock || 0;
      console.log(`- ${item.productName}: Requested ${item.quantity}, Available ${currentStock}`);
      
      if (currentStock < item.quantity) {
        console.log(`❌ Insufficient stock for ${item.productName}`);
        await session.abortTransaction();
        return;
      }
    }
    
    console.log('✅ Stock check passed');

    // Process each item
    console.log('\n🔧 Processing items...');
    for (const item of itemsToProcess) {
      // Log stock reduction
      const originalStock = item.productData.stock;
      console.log(`- Reducing stock for ${item.productName}: ${originalStock} -> ${originalStock - item.quantity}`);
      
      // Reduce stock
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } },
        { session }
      );

      // Calculate profit
      const costPrice = item.productData.costPrice || 0;
      const salePrice = item.productData.salePrice || item.price;
      const profit = salePrice - costPrice;
      const totalProfit = profit * item.quantity;

      console.log(`  💰 Profit calculation: (${salePrice} - ${costPrice}) * ${item.quantity} = $${totalProfit}`);

      // Create order summary entry
      const orderSummary = new OrderSummary({
        giftId: collaborativePurchase._id,
        productSKU: item.productData.sku || 'N/A',
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        costPrice: costPrice,
        retailPrice: item.productData.retailPrice || item.price,
        salePrice: salePrice,
        profit: profit,
        totalProfit: totalProfit,
        orderDate: new Date(),
        status: 'collaborative'
      });

      await orderSummary.save({ session });
      console.log(`  📋 Order summary created for ${item.productName}`);
    }

    // Update collaborative purchase status
    collaborativePurchase.status = 'packing';
    await collaborativePurchase.save({ session });
    console.log('✅ Collaborative purchase status updated to: packing');

    await session.commitTransaction();
    console.log('✅ Transaction committed successfully');

    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const updatedPurchase = await CollaborativePurchase.findById(collaborativePurchase._id);
    console.log('Updated status:', updatedPurchase.status);
    
    const orderSummaries = await OrderSummary.find({ giftId: collaborativePurchase._id });
    console.log('Order summaries created:', orderSummaries.length);
    
    for (const summary of orderSummaries) {
      console.log(`  - ${summary.productName}: Qty ${summary.quantity}, Profit $${summary.totalProfit}`);
    }

    console.log('\n🎉 Packing process test completed successfully!');

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Packing process failed:', error);
  } finally {
    session.endSession();
  }
}

testCollaborativePacking();