// Test the config API directly
async function testConfigAPI() {
  console.log('🔍 Testing /api/config endpoint...\n');

  try {
    const response = await fetch('http://localhost:3000/api/config');
    const data = await response.json();
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Gallery items:', data.gallery ? data.gallery.length : 0);
    
    if (data.gallery && data.gallery.length > 0) {
      console.log('📸 Sample gallery items:');
      data.gallery.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.url}`);
      });
      console.log('\n🎉 SUCCESS: API is returning gallery data!');
    } else {
      console.log('❌ No gallery data in API response');
      console.log('📝 Available fields:', Object.keys(data));
    }

  } catch (error) {
    console.error('❌ API Test failed:', error);
  }
}

testConfigAPI();
