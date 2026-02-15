// Test timeline update exactly like the frontend does
async function testFrontendTimeline() {
  console.log('🧪 Testing Timeline Update Like Frontend...\n');

  try {
    // Test exactly like the frontend API client does
    const testId = '1d98db6e-9da8-4988-99a1-ebd20e4890cf';
    
    console.log('1️⃣  Testing timelineAPI.update() like frontend:');
    
    // Simulate the exact data structure from frontend
    const updateData = {
      text: 'Frontend test update',
      type: 'pet',
      location: 'Frontend location',
      timestamp: '2024-02-15T10:00:00Z',
      files: [] // No files for this test
    };
    
    console.log('📝 Update data:', updateData);
    
    // Test the exact API call like frontend does
    try {
      const formData = new FormData();
      
      // Add data like frontend does
      if (updateData.text !== undefined) formData.append('text', updateData.text);
      if (updateData.type !== undefined) formData.append('type', updateData.type);
      if (updateData.location !== undefined) formData.append('location', updateData.location);
      if (updateData.timestamp !== undefined) formData.append('timestamp', updateData.timestamp);
      
      // Add files if any (none in this test)
      updateData.files.forEach(file => {
        formData.append('media', file);
      });
      
      console.log('📤 FormData created, sending request...');
      
      const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'POST',
        body: formData
      });
      
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success! Response:', data);
      } else {
        const errorText = await response.text();
        console.log(`❌ Error response: ${errorText}`);
        
        try {
          const errorData = JSON.parse(errorText);
          console.log('🔍 Parsed error:', errorData);
        } catch (parseError) {
          console.log('🔍 Raw error text:', errorText);
        }
      }
      
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }

    // Test with files (if we can create a test file)
    console.log('\n2️⃣  Testing with a mock file:');
    
    try {
      // Create a simple test file
      const testFile = new Blob(['test file content'], { type: 'text/plain' });
      const file = new File([testFile], 'test.txt', { type: 'text/plain' });
      
      const formDataWithFile = new FormData();
      formDataWithFile.append('text', 'Test with file');
      formDataWithFile.append('type', 'pet');
      formDataWithFile.append('media', file);
      
      console.log('📁 FormData with file created, sending request...');
      
      const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'POST',
        body: formDataWithFile
      });
      
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Error with file: ${errorText}`);
      } else {
        console.log('✅ File upload test succeeded');
      }
      
    } catch (error) {
      console.log(`❌ File test error: ${error.message}`);
    }

    console.log('\n💡 Check the server logs for detailed debugging information');
    console.log('🔍 The server logs should show exactly what\'s happening during the request');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendTimeline();
