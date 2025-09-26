const { getProductRecommendations } = require('../utils/productRecommendation');

// Test product recommendations for different occasions
async function testProductRecommendations() {
  console.log('🧪 Testing Product Recommendations...\n');

  const testOccasions = ['birthday', 'anniversary', 'wedding', 'christmas', 'general'];

  for (const occasion of testOccasions) {
    try {
      console.log(`🎯 Testing ${occasion.toUpperCase()} occasion:`);
      const recommendations = await getProductRecommendations(occasion, 3);
      
      if (recommendations.length > 0) {
        console.log(`✅ Found ${recommendations.length} recommendations:`);
        recommendations.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} - $${product.price}`);
          console.log(`      Category: ${product.mainCategory}`);
          console.log(`      Link: ${product.link}`);
        });
      } else {
        console.log('❌ No recommendations found');
      }
      console.log('');
    } catch (error) {
      console.error(`❌ Error testing ${occasion}:`, error.message);
    }
  }
}

// Only run if called directly
if (require.main === module) {
  testProductRecommendations();
}

module.exports = { testProductRecommendations };