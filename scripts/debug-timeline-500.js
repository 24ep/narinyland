// Debug the 500 Internal Server Error in timeline API
async function debugTimeline500() {
  console.log('🔍 Debugging Timeline 500 Error...\n');

  try {
    // Test the exact request that's failing
    console.log('1️⃣  Testing the exact failing request:');
    
    const testId = '1d98db6e-9da8-4988-99a1-ebd20e4890cf';
    const testUrl = `http://localhost:3000/api/timeline/${testId}`;
    
    console.log(`   🔗 URL: ${testUrl}`);
    console.log(`   📝 Method: POST`);
    console.log(`   📄 Body: FormData`);
    
    // Create test FormData similar to what frontend sends
    const formData = new FormData();
    formData.append('text', 'Test timeline update');
    formData.append('type', 'pet');
    formData.append('location', 'Test location');
    formData.append('timestamp', '2024-02-15T10:00:00Z');
    
    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        body: formData
      });
      
      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Success! Response:', data);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error Response: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }

    // Check if the timeline item exists
    console.log('\n2️⃣  Checking if timeline item exists:');
    
    try {
      const checkResponse = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'GET'
      });
      
      if (checkResponse.ok) {
        const data = await checkResponse.json();
        console.log(`   ✅ Timeline item exists: ${data.id}`);
        console.log(`   📝 Current text: ${data.text}`);
        console.log(`   🎭 Current type: ${data.type}`);
      } else {
        console.log(`   ❌ Timeline item not found (status: ${checkResponse.status})`);
      }
    } catch (error) {
      console.log(`   ❌ Check failed: ${error.message}`);
    }

    // Test with a simple FormData without files
    console.log('\n3️⃣  Testing with minimal FormData:');
    
    const minimalFormData = new FormData();
    minimalFormData.append('text', 'Simple test');
    
    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        body: minimalFormData
      });
      
      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
        
        // Try to parse the error
        try {
          const errorData = JSON.parse(errorText);
          console.log(`   🔍 Parsed Error:`, errorData);
        } catch (parseError) {
          console.log(`   🔍 Raw Error Text: ${errorText}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugTimeline500();
