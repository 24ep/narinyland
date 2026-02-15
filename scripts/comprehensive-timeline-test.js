// Comprehensive timeline test to identify the exact issue
async function comprehensiveTimelineTest() {
  console.log('🔍 Comprehensive Timeline Test...\n');

  try {
    const testId = '1d98db6e-9da8-4988-99a1-ebd20e4890cf';
    
    // Test 1: Check if the timeline item exists and what its current state is
    console.log('1️⃣  Checking current timeline item state:');
    
    try {
      const getResponse = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'GET'
      });
      
      if (getResponse.ok) {
        const item = await getResponse.json();
        console.log('   ✅ Timeline item found:');
        console.log(`      📝 Text: "${item.text}"`);
        console.log(`      🎭 Type: ${item.type}`);
        console.log(`      📍 Location: ${item.location}`);
        console.log(`      📅 Timestamp: ${item.timestamp}`);
        console.log(`      📸 Media items: ${item.mediaItems?.length || 0}`);
      } else {
        console.log(`   ❌ Timeline item not found: ${getResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking timeline item: ${error.message}`);
    }

    // Test 2: Test with different data combinations
    console.log('\n2️⃣  Testing different data combinations:');
    
    const testCases = [
      {
        name: 'Minimal data',
        data: { text: 'Minimal test' }
      },
      {
        name: 'All fields',
        data: { 
          text: 'All fields test', 
          type: 'pet', 
          location: 'Test location', 
          timestamp: '2024-02-15T10:00:00Z' 
        }
      },
      {
        name: 'Empty text',
        data: { text: '', type: 'pet' }
      },
      {
        name: 'Null values',
        data: { text: null, type: null, location: null }
      },
      {
        name: 'Invalid timestamp',
        data: { text: 'Invalid timestamp test', timestamp: 'invalid-date' }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n   🧪 Testing: ${testCase.name}`);
      
      try {
        const formData = new FormData();
        
        // Add data like frontend does
        Object.entries(testCase.data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        });
        
        const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
          method: 'POST',
          body: formData
        });
        
        console.log(`      📊 Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`      ❌ Error: ${errorText}`);
          
          try {
            const errorData = JSON.parse(errorText);
            console.log(`      🔍 Details: ${errorData.details || 'No details'}`);
          } catch (parseError) {
            console.log(`      🔍 Raw error: ${errorText}`);
          }
        } else {
          console.log(`      ✅ Success`);
        }
        
      } catch (error) {
        console.log(`      ❌ Network error: ${error.message}`);
      }
    }

    // Test 3: Test with actual file upload
    console.log('\n3️⃣  Testing with actual file upload:');
    
    try {
      // Create a small test image (1x1 pixel PNG)
      const pngData = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      const testFile = new File([pngData], 'test.png', { type: 'image/png' });
      
      const formData = new FormData();
      formData.append('text', 'Test with image');
      formData.append('type', 'pet');
      formData.append('media', testFile);
      
      const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'POST',
        body: formData
      });
      
      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Error with image: ${errorText}`);
      } else {
        console.log(`   ✅ Image upload test succeeded`);
      }
      
    } catch (error) {
      console.log(`   ❌ Image test error: ${error.message}`);
    }

    console.log('\n💡 If all tests pass, the issue might be:');
    console.log('   1. Frontend sending different data format');
    console.log('   2. Authentication/authorization issue');
    console.log('   3. Browser-specific problem');
    console.log('   4. Timing issue (race condition)');
    console.log('   5. Server-side error not caught in tests');

  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
  }
}

comprehensiveTimelineTest();
