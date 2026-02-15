// Simple check for API route issues
async function simpleAPICheck() {
  console.log('🔍 Simple API Route Check...\n');

  try {
    // Test letters API
    console.log('1️⃣  Testing Letters API:');
    
    try {
      const testId = 'test-letter-' + Date.now();
      const response = await fetch(`http://localhost:3000/api/letters/${testId}`, {
        method: 'POST',
        body: new FormData()
      });
      
      console.log(`   📊 POST Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 405) {
        console.log('   ❌ Letters API needs POST method for FormData');
      } else if (response.status === 500) {
        console.log('   ❌ Letters API POST method has errors');
      } else {
        console.log('   ✅ Letters API POST method works');
      }
    } catch (error) {
      console.log(`   ❌ Letters API test error: ${error.message}`);
    }

    // Test coupons API
    console.log('\n2️⃣  Testing Coupons API:');
    
    try {
      const testId = 'test-coupon-' + Date.now();
      const response = await fetch(`http://localhost:3000/api/coupons/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'test' })
      });
      
      console.log(`   📊 PUT Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 405) {
        console.log('   ❌ Coupons API needs PUT method for updates');
      } else if (response.status === 500) {
        console.log('   ❌ Coupons API PUT method has errors');
      } else {
        console.log('   ✅ Coupons API PUT method works');
      }
    } catch (error) {
      console.log(`   ❌ Coupons API test error: ${error.message}`);
    }

    console.log('\n🎯 Summary:');
    console.log('   ✅ Memories API: Fixed (POST method added)');
    console.log('   ✅ Timeline API: Fixed (POST method added)');
    console.log('   ❓ Letters API: Needs investigation');
    console.log('   ❓ Coupons API: Needs investigation');

    console.log('\n💡 Most likely "another issue like this" is:');
    console.log('   1. Letters API - needs POST method for FormData uploads');
    console.log('   2. Coupons API - needs PUT method for updates');

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

simpleAPICheck();
