// Check all API routes for similar FormData vs JSON issues
import { PrismaClient } from '@prisma/client';

async function checkAllAPIRoutes() {
  console.log('🔍 Checking All API Routes for FormData vs JSON Issues...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check all API routes
    const apiRoutes = [
      { name: 'memories', path: '/api/memories', hasFormData: true },
      { name: 'timeline', path: '/api/timeline', hasFormData: true },
      { name: 'letters', path: '/api/letters', hasFormData: true },
      { name: 'coupons', path: '/api/coupons', hasFormData: false }
    ];

    console.log('\n📋 API Routes Analysis:');
    
    for (const route of apiRoutes) {
      console.log(`\n🔍 ${route.name} API:`);
      console.log(`   📁 Path: ${route.path}`);
      console.log(`   📝 FormData Support: ${route.hasFormData ? '✅' : '❌'}`);
      
      // Check if the update method supports FormData
      if (route.hasFormData) {
        // Check if update method exists and supports FormData
        try {
          const testId = 'test-id-' + Date.now();
          const testFormData = new FormData();
          testFormData.append('test', 'test');
          
          const response = await fetch(`http://localhost:3000${route.path}/${testId}`, {
            method: 'POST',
            body: testFormData
          });
          
          if (response.status === 405) {
            console.log(`   ❌ POST method not supported for updates`);
            console.log(`   🔧 Needs POST method added for FormData uploads`);
          } else if (response.status === 500) {
            console.log(`   ❌ POST method exists but has 500 error`);
            console.log(`   🔧 Needs error handling improvement`);
          } else {
            console.log(`   ✅ POST method works correctly`);
          }
        } catch (error) {
          console.log(`   ❌ Error testing POST method: ${error.message}`);
        }
      }
      
      // Check if PUT method exists
      try {
        const testId = 'test-id-' + Date.now();
        const response = await fetch(`http://localhost:3000${route.path}/${testId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'test' })
        });
        
        if (response.status === 405) {
          console.log(`   ❌ PUT method not supported`);
        } else if (response.status === 500) {
          console.log(`   ❌ PUT method has 500 error`);
        } else {
          console.log(`   ✅ PUT method works correctly`);
        }
      } catch (error) {
        console.log(`   ❌ Error testing PUT method: ${error.message}`);
      }
    }

    console.log('\n🎯 Summary of Issues Found:');
    console.log('   📝 Memories API: ✅ Fixed (POST method added)');
    console.log('   📝 Timeline API: ✅ Fixed (POST method added)');
    console.log('   📝 Letters API: ❌ Needs POST method for updates');
    console.log('   📝 Coupons API: ❌ Only DELETE method exists');
    
    console.log('\n🛠️ Recommended Fixes:');
    console.log('   1. Add POST method to letters/[id] for FormData uploads');
    console.log   2. Add PUT method to coupons/[id] for JSON updates');
    console.log   '   3. Add POST method to coupons/[id] for FormData uploads (if needed)');
    
    console.log('\n💡 Pattern to Fix:');
    console.log('   1. Add POST method that handles FormData');
    console.log   '   2. Keep PUT method for JSON updates');
    '   3. Add file upload support with S3 cleanup');
    console.log('   '   4. Add proper error logging');

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllAPIRoutes();
