#!/usr/bin/env node

// Webhook Test Script
// This script tests the revalidation endpoint to ensure it's working correctly

const BASE_URL = 'http://localhost:3000';
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'test-secret';

async function testRevalidationEndpoint() {
  console.log('🔗 Testing Revalidation Endpoint...\n');
  
  const testCases = [
    {
      name: 'Valid Tag Revalidation',
      payload: {
        tag: 'merchant:agoda-tw',
        secret: REVALIDATE_SECRET
      },
      expectedStatus: 200
    },
    {
      name: 'Valid Path Revalidation',
      payload: {
        tag: 'merchant:agoda-tw',
        path: '/shop/agoda-tw',
        secret: REVALIDATE_SECRET
      },
      expectedStatus: 200
    },
    {
      name: 'Invalid Secret',
      payload: {
        tag: 'merchant:agoda-tw',
        secret: 'wrong-secret'
      },
      expectedStatus: 403
    },
    {
      name: 'Missing Secret',
      payload: {
        tag: 'merchant:agoda-tw'
      },
      expectedStatus: 403
    },
    {
      name: 'Missing Tag',
      payload: {
        secret: REVALIDATE_SECRET
      },
      expectedStatus: 200 // Should still work, just no tag to revalidate
    }
  ];

  for (const testCase of testCases) {
    console.log(`📊 Testing: ${testCase.name}`);
    console.log(`   Payload: ${JSON.stringify(testCase.payload)}`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload)
      });
      
      const status = response.status;
      const text = await response.text();
      
      console.log(`   Status: ${status}`);
      console.log(`   Response: ${text}`);
      
      if (status === testCase.expectedStatus) {
        console.log(`   ✅ PASS: Expected status ${testCase.expectedStatus}`);
      } else {
        console.log(`   ❌ FAIL: Expected ${testCase.expectedStatus}, got ${status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🏆 Webhook testing completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Configure your Strapi webhooks using the WEBHOOK_CONFIGURATION.md guide');
  console.log('2. Set REVALIDATE_SECRET in your environment variables');
  console.log('3. Test webhook triggers from Strapi admin panel');
  console.log('4. Monitor cache invalidation in your application');
}

// Run the test
testRevalidationEndpoint()
  .then(() => {
    console.log('\n✅ Webhook testing completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Webhook testing failed:', error);
    process.exit(1);
  });
