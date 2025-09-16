const OrderSummary = require('../models/OrderSummary');
const Product = require('../models/Product'); // Import Product model

// Create order summary records
const createOrderSummary = async (req, res) => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Records array is required and must not be empty'
      });
    }

    // Fetch costPrice for each product in parallel
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const product = await Product.findById(record.productId).select('costPrice');
        if (!product) {
          throw new Error(`Product with ID ${record.productId} not found`);
        }

        const costPrice = product.costPrice || 0;
        const profit = record.salePrice - costPrice;

        return {
          ...record,
          costPrice,
          profit,
          totalProfit: profit * record.quantity
        };
      })
    );

    // Create the order summary records
    const createdRecords = await OrderSummary.insertMany(enrichedRecords);

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdRecords.length} order summary records`,
      data: createdRecords
    });
  } catch (error) {
    console.error('Error creating order summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating order summary',
      error: error.message
    });
  }
};

// Get order summary records
const getOrderSummaries = async (req, res) => {
  try {
    const { giftId, productId, startDate, endDate } = req.query;
    
    let filter = {};
    
    if (giftId) {
      filter.giftId = giftId;
    }
    
    if (productId) {
      filter.productId = productId;
    }
    
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) {
        filter.orderDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.orderDate.$lte = new Date(endDate);
      }
    }

    const orderSummaries = await OrderSummary.find(filter)
      .populate('giftId', 'recipientName user')
      .populate('productId', 'name images')
      .sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      count: orderSummaries.length,
      data: orderSummaries
    });

  } catch (error) {
    console.error('Error fetching order summaries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching order summaries',
      error: error.message
    });
  }
};

// Get profit analytics
const getProfitAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchFilter = {};
    
    if (startDate || endDate) {
      matchFilter.orderDate = {};
      if (startDate) {
        matchFilter.orderDate.$gte = new Date(startDate);
      }
      if (endDate) {
        matchFilter.orderDate.$lte = new Date(endDate);
      }
    }

    const analytics = await OrderSummary.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: { $multiply: ['$salePrice', '$quantity'] } },
          totalCost: { $sum: { $multiply: ['$costPrice', '$quantity'] } },
          totalProfit: { $sum: '$totalProfit' },
          avgProfitPerOrder: { $avg: '$totalProfit' }
        }
      }
    ]);

    const result = analytics.length > 0 ? analytics[0] : {
      totalOrders: 0,
      totalQuantity: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      avgProfitPerOrder: 0
    };

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching profit analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching profit analytics',
      error: error.message
    });
  }
};

module.exports = {
  createOrderSummary,
  getOrderSummaries,
  getProfitAnalytics
};