const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testSurpriseGiftTabs() {
    console.log('🧪 Testing Surprise Gift Tab Filtering...\n');
    
    const tabs = [
        { name: 'Processing', expectedStatus: 'Pending' },
        { name: 'Packing', expectedStatus: 'Paid' },
        { name: 'DeliveryConfirmed', expectedStatus: 'OutForDelivery' },
        { name: 'AllOrders', expectedStatus: 'Delivered' }
    ];
    
    for (const tab of tabs) {
        try {
            console.log(`📋 Testing ${tab.name} tab (expecting status: ${tab.expectedStatus})...`);
            
            const response = await axios.get(`${API_BASE}/surprise?tab=${tab.name}`);
            
            if (response.data.success) {
                const orders = response.data.data;
                console.log(`   ✅ Found ${orders.length} orders`);
                
                // Check if all orders have the expected status
                const correctStatusCount = orders.filter(order => order.status === tab.expectedStatus).length;
                const incorrectOrders = orders.filter(order => order.status !== tab.expectedStatus);
                
                if (orders.length === 0) {
                    console.log(`   ℹ️  No orders found for ${tab.name} tab`);
                } else if (correctStatusCount === orders.length) {
                    console.log(`   ✅ All ${orders.length} orders have correct status: ${tab.expectedStatus}`);
                } else {
                    console.log(`   ❌ Status mismatch! ${correctStatusCount}/${orders.length} orders have correct status`);
                    incorrectOrders.forEach(order => {
                        console.log(`      - Order ${order._id}: expected '${tab.expectedStatus}', got '${order.status}'`);
                    });
                }
            } else {
                console.log(`   ❌ API Error: ${response.data.message}`);
            }
        } catch (error) {
            console.log(`   ❌ Request Error: ${error.message}`);
        }
        console.log();
    }
    
    // Test default behavior (no tab parameter)
    try {
        console.log('📋 Testing default behavior (no tab parameter)...');
        const response = await axios.get(`${API_BASE}/surprise`);
        
        if (response.data.success) {
            console.log(`   ✅ Found ${response.data.data.length} total surprise gifts`);
        } else {
            console.log(`   ❌ API Error: ${response.data.message}`);
        }
    } catch (error) {
        console.log(`   ❌ Request Error: ${error.message}`);
    }
    
    console.log('\n🏁 Tab filtering test completed!');
}

// Run the test
testSurpriseGiftTabs().catch(console.error);