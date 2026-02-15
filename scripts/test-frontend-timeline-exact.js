// Test exactly like the frontend timelineAPI.update
async function testFrontendTimelineExact() {
  console.log('🧪 Testing Frontend Timeline Update Exact...\n');

  try {
    const testId = '1d98db6e-9da8-4988-99a1-ebd20e4890cf';
    
    console.log('1️⃣  Testing exact frontend timelineAPI.update logic:');
    
    // Simulate the exact data structure that frontend might send
    // This could include problematic data like undefined, null, empty strings, etc.
    
    const testCases = [
      {
        name: 'Normal data',
        data: {
          text: 'Normal test',
          type: 'pet',
          location: 'Test location',
          timestamp: '2024-02-15T10:00:00Z',
          files: []
        }
      },
      {
        name: 'Empty strings',
        data: {
          text: '',
          type: '',
          location: '',
          timestamp: '',
          files: []
        }
      },
      {
        name: 'Undefined values',
        data: {
          text: undefined,
          type: undefined,
          location: undefined,
          timestamp: undefined,
          files: undefined
        }
      },
      {
        name: 'Null values',
        data: {
          text: null,
          type: null,
          location: null,
          timestamp: null,
          files: null
        }
      },
      {
        name: 'Mixed problematic data',
        data: {
          text: 'Test',
          type: undefined,
          location: '',
          timestamp: null,
          files: []
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n   🧪 Testing: ${testCase.name}`);
      
      try {
        // Simulate the exact frontend logic
        if (testCase.data.files && testCase.data.files.length > 0) {
          const formData = new FormData();
          
          // This is the exact logic from the frontend
          testCase.data.files.forEach(file => {
            formData.append('media', file);
          });
          if (testCase.data.text !== undefined) formData.append('text', testCase.data.text);
          if (testCase.data.type !== undefined) formData.append('type', testCase.data.type);
          if (testCase.data.location !== undefined) formData.append('location', testCase.data.location);
          if (testCase.data.timestamp !== undefined) formData.append('timestamp', testCase.data.timestamp);
          
          console.log(`      📤 FormData created with ${testCase.data.files.length} files`);
          
          // Test the exact fetchFormData call
          const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
            method: 'POST',
            body: formData
          });
          
          console.log(`      📊 Status: ${response.status} ${response.statusText}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.log(`      ❌ Error: ${errorText}`);
          } else {
            console.log(`      ✅ Success`);
          }
        } else {
          // Test JSON fallback
          const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testCase.data)
          });
          
          console.log(`      📊 PUT Status: ${response.status} ${response.statusText}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.log(`      ❌ PUT Error: ${errorText}`);
          } else {
            console.log(`      ✅ PUT Success`);
          }
        }
        
      } catch (error) {
        console.log(`      ❌ Test error: ${error.message}`);
      }
    }

    console.log('\n2️⃣  Testing with actual file (like frontend might send):');
    
    try {
      // Create a test file
      const testFile = new Blob(['test file content'], { type: 'text/plain' });
      const file = new File([testFile], 'test.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('media', file);
      formData.append('text', 'Test with file');
      formData.append('type', 'pet');
      
      const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'POST',
        body: formData
      });
      
      console.log(`   📊 File upload Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ File upload error: ${errorText}`);
      } else {
        console.log(`   ✅ File upload success`);
      }
      
    } catch (error) {
      console.log(`   ❌ File upload test error: ${error.message}`);
    }

    console.log('\n💡 If all tests pass, the issue might be:');
    console.log('   1. Browser-specific problem');
    console.log('   2. Different data format from frontend');
    console.log('   3. Authentication/authorization issue');
    console.log('   4. Network timing issue');
    console.log('   5. Frontend state management issue');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendTimelineExact();
