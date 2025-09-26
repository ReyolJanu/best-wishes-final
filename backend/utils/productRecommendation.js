const Product = require('../models/Product');

// Keywords mapping for different occasions
const occasionKeywords = {
  birthday: ['birthday', 'cake', 'celebration', 'party', 'gift', 'candle', 'balloon', 'surprise', 'happy birthday'],
  anniversary: ['anniversary', 'love', 'couple', 'romantic', 'romance', 'heart', 'together', 'forever', 'wedding'],
  wedding: ['wedding', 'bride', 'groom', 'marriage', 'ceremony', 'bridal', 'ring', 'bouquet', 'white', 'dress'],
  graduation: ['graduation', 'diploma', 'achievement', 'success', 'graduate', 'education', 'school', 'college', 'university'],
  baby_shower: ['baby', 'newborn', 'infant', 'shower', 'pregnancy', 'mother', 'cute', 'soft', 'toy'],
  housewarming: ['home', 'house', 'new home', 'housewarming', 'decor', 'furniture', 'decoration', 'plant', 'welcome'],
  valentine_day: ['valentine', 'love', 'romantic', 'heart', 'red', 'rose', 'romance', 'couple', 'date'],
  mother_day: ['mother', 'mom', 'mama', 'maternal', 'care', 'love', 'appreciation', 'family', 'woman'],
  father_day: ['father', 'dad', 'papa', 'paternal', 'man', 'masculine', 'strength', 'family', 'appreciation'],
  christmas: ['christmas', 'xmas', 'holiday', 'santa', 'tree', 'gift', 'festive', 'red', 'green', 'winter'],
  new_year: ['new year', 'celebration', 'party', 'champagne', 'fireworks', 'resolution', 'fresh start', 'golden'],
  thanksgiving: ['thanksgiving', 'grateful', 'thankful', 'harvest', 'autumn', 'family', 'dinner', 'turkey'],
  engagement: ['engagement', 'proposal', 'ring', 'couple', 'love', 'commitment', 'romantic', 'forever'],
  retirement: ['retirement', 'senior', 'relaxation', 'freedom', 'achievement', 'career', 'rest', 'hobby'],
  promotion: ['promotion', 'success', 'achievement', 'career', 'professional', 'congratulations', 'office', 'work'],
  get_well_soon: ['get well', 'health', 'recovery', 'healing', 'care', 'comfort', 'wellness', 'medicine', 'support'],
  sympathy: ['sympathy', 'condolence', 'comfort', 'support', 'care', 'thoughtful', 'peaceful', 'memory'],
  congratulations: ['congratulations', 'achievement', 'success', 'celebration', 'proud', 'accomplishment', 'victory'],
  thank_you: ['thank you', 'appreciation', 'grateful', 'thanks', 'gratitude', 'thoughtful', 'kind', 'generous'],
  general: ['gift', 'present', 'surprise', 'special', 'thoughtful', 'care', 'love', 'appreciation']
};

/**
 * Get product recommendations based on occasion
 * @param {string} occasion - The occasion type
 * @param {number} limit - Maximum number of products to return (default: 5)
 * @returns {Promise<Array>} Array of recommended products
 */
async function getProductRecommendations(occasion, limit = 5) {
  try {
    const keywords = occasionKeywords[occasion] || occasionKeywords.general;
    
    // Create a search query that looks for keywords in name, shortDescription, and tags
    const searchQuery = {
      status: 'active',
      $or: [
        { name: { $regex: keywords.join('|'), $options: 'i' } },
        { shortDescription: { $regex: keywords.join('|'), $options: 'i' } },
        { tags: { $in: keywords.map(keyword => new RegExp(keyword, 'i')) } },
        { mainCategory: { $regex: keywords.join('|'), $options: 'i' } }
      ]
    };

    // Find products matching the occasion keywords
    let recommendedProducts = await Product.find(searchQuery)
      .select('name shortDescription mainCategory images price salePrice retailPrice rating tags')
      .sort({ rating: -1, featured: -1 })
      .limit(limit * 2); // Get more to filter better ones

    // If we don't have enough products, get some featured/high-rated products
    if (recommendedProducts.length < 3) {
      const fallbackProducts = await Product.find({
        status: 'active',
        _id: { $nin: recommendedProducts.map(p => p._id) }
      })
      .select('name shortDescription mainCategory images price salePrice retailPrice rating tags')
      .sort({ featured: -1, rating: -1 })
      .limit(limit - recommendedProducts.length);
      
      recommendedProducts = [...recommendedProducts, ...fallbackProducts];
    }

    // Ensure we have at least 1 product and maximum specified limit
    recommendedProducts = recommendedProducts.slice(0, Math.max(1, limit));

    // Format the products with additional information
    return recommendedProducts.map(product => ({
      _id: product._id,
      name: product.name,
      shortDescription: product.shortDescription,
      mainCategory: product.mainCategory,
      image: product.images && product.images.length > 0 ? product.images[0].url : null,
      price: product.salePrice > 0 ? product.salePrice : product.retailPrice,
      originalPrice: product.retailPrice,
      onSale: product.salePrice > 0,
      rating: product.rating || 3,
      link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/productDetail/${product._id}`,
      tags: product.tags
    }));

  } catch (error) {
    console.error('Error getting product recommendations:', error);
    // Return at least one fallback product in case of error
    try {
      const fallbackProduct = await Product.findOne({ status: 'active' })
        .select('name shortDescription mainCategory images price salePrice retailPrice rating')
        .sort({ featured: -1, rating: -1 });
      
      if (fallbackProduct) {
        return [{
          _id: fallbackProduct._id,
          name: fallbackProduct.name,
          shortDescription: fallbackProduct.shortDescription,
          mainCategory: fallbackProduct.mainCategory,
          image: fallbackProduct.images && fallbackProduct.images.length > 0 ? fallbackProduct.images[0].url : null,
          price: fallbackProduct.salePrice > 0 ? fallbackProduct.salePrice : fallbackProduct.retailPrice,
          originalPrice: fallbackProduct.retailPrice,
          onSale: fallbackProduct.salePrice > 0,
          rating: fallbackProduct.rating || 3,
          link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/productDetail/${fallbackProduct._id}`
        }];
      }
    } catch (fallbackError) {
      console.error('Error getting fallback product:', fallbackError);
    }
    
    return [];
  }
}

/**
 * Get available occasion types for dropdown
 * @returns {Array} Array of occasion objects with value and label
 */
function getOccasionTypes() {
  return [
    { value: 'birthday', label: '🎂 Birthday' },
    { value: 'anniversary', label: '💕 Anniversary' },
    { value: 'wedding', label: '💒 Wedding' },
    { value: 'graduation', label: '🎓 Graduation' },
    { value: 'baby_shower', label: '👶 Baby Shower' },
    { value: 'housewarming', label: '🏠 Housewarming' },
    { value: 'valentine_day', label: '💘 Valentine\'s Day' },
    { value: 'mother_day', label: '👩 Mother\'s Day' },
    { value: 'father_day', label: '👨 Father\'s Day' },
    { value: 'christmas', label: '🎄 Christmas' },
    { value: 'new_year', label: '🎊 New Year' },
    { value: 'thanksgiving', label: '🦃 Thanksgiving' },
    { value: 'engagement', label: '💍 Engagement' },
    { value: 'retirement', label: '🎯 Retirement' },
    { value: 'promotion', label: '📈 Promotion' },
    { value: 'get_well_soon', label: '🌸 Get Well Soon' },
    { value: 'sympathy', label: '🕊️ Sympathy' },
    { value: 'congratulations', label: '🎉 Congratulations' },
    { value: 'thank_you', label: '🙏 Thank You' },
    { value: 'general', label: '🎁 General Gift' }
  ];
}

module.exports = {
  getProductRecommendations,
  getOccasionTypes,
  occasionKeywords
};