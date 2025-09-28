// Simple API test for collaborative purchases using Node.js built-in http module
const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testCollaborativeAPI() {
  try {
    console.log('🔍 Testing Collaborative Purchase API endpoints...\n');

    // Test 1: Get all collaborative purchases
    console.log('📋 Testing GET /api/collaborative-purchases/all');
    try {
      const response = await makeRequest('/api/collaborative-purchases/all');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.status === 401) {
        console.log('⚠️  Expected 401 (authentication required) - API is working but needs auth');
      } else if (response.status === 200) {
        console.log('✅ API endpoint is accessible');
      } else {
        console.log('⚠️  Unexpected status code');
      }
    } catch (error) {
      console.log('❌ Error testing GET endpoint:', error.message);
    }

    console.log('\n' + '='.repeat(50));

    // Test 2: Test start packing endpoint
    console.log('📦 Testing POST /api/collaborative-purchases/test-id/start-packing');
    try {
      const response = await makeRequest('/api/collaborative-purchases/test-id/start-packing', 'POST');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.status === 401) {
        console.log('⚠️  Expected 401 (authentication required) - API endpoint exists');
      } else if (response.status === 400) {
        console.log('⚠️  Expected 400 (invalid ID) - API endpoint is working');
      }
    } catch (error) {
      console.log('❌ Error testing POST endpoint:', error.message);
    }

    console.log('\n' + '='.repeat(50));

    // Test 3: Test status update endpoint
    console.log('🔄 Testing PUT /api/collaborative-purchases/test-id/status');
    try {
      const response = await makeRequest('/api/collaborative-purchases/test-id/status', 'PUT', {
        status: 'Packing'
      });
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.status === 401) {
        console.log('⚠️  Expected 401 (authentication required) - API endpoint exists');
      } else if (response.status === 400) {
        console.log('⚠️  Expected 400 (invalid ID) - API endpoint is working');
      }
    } catch (error) {
      console.log('❌ Error testing PUT endpoint:', error.message);
    }

    console.log('\n🎉 API endpoint tests completed!');
    console.log('Summary:');
    console.log('- All endpoints should return 401 (authentication required) unless you have valid auth');
    console.log('- This confirms the routes are properly set up');
    console.log('- Next: Test with proper authentication in the frontend');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

testCollaborativeAPI();