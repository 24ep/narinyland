// Debug the specific timeline 500 error
async function debugTimeline500() {
  console.log('🔍 Debugging Specific Timeline 500 Error...\n');

  try {
    const testId = '1d98db6e-9da8-4988-99a1-ebd20e4890cf';
    
    console.log('1️⃣  Testing exact same request as frontend:');
    
    // Test exactly like the frontend does - using fetchFormData
    const formData = new FormData();
    formData.append('text', 'Test timeline update');
    formData.append('type', 'pet');
    formData.append('location', 'Test location');
    formData.append('timestamp', '2024-02-15T10:00:00Z');
    
    console.log('📤 FormData created with:');
    console.log(`   📝 text: ${formData.get('text')}`);
    console.log(`   🎭 type: ${formData.get('type')}`);
    console.log(`   📍 location: ${formData.get('location')}`);
    console.log(`   📅 timestamp: ${formData.get('timestamp')}`);
    
    try {
      const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'POST',
        body: formData
      });
      
      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Success! Response:', data);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
        
        try {
          const errorData = JSON.parse(errorText);
          console.log(`   🔍 Parsed Error: ${errorData.error}`);
          if (errorData.details) {
            console.log(`   🔍 Details: ${errorData.details.substring(0, 200)}...`);
          }
        } catch (parseError) {
          console.log(`   🔍 Raw Error: ${errorText}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }

    console.log('\n2️⃣  Checking if timeline item exists:');
    
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
      console.log(`   ❌ Check failed: ${error.message}`);
    }

    console.log('\n3️⃣  Testing with minimal data:');
    
    try {
      const minimalFormData = new FormData();
      minimalFormData.append('text', 'Minimal test');
      
      const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'POST',
        body: minimalFormData
      });
      
      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Minimal test error: ${errorText}`);
      } else {
        console.log('   ✅ Minimal test works');
      }
      
    } catch (error) {
      console.log(`   ❌ Minimal test error: ${error.message}`);
    }

    console.log('\n💡 Possible causes:');
    console.log('   1. Database connection issues');
    console.log('   2. Invalid timestamp format');
    console.log('   3. Missing required fields');
    console.log('   4. S3 upload issues (if files included)');
    console.log('   5. Prisma schema mismatch');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugTimeline500();
