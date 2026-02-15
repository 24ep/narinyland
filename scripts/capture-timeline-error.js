// Capture the exact timeline error from frontend
async function captureTimelineError() {
  console.log('🔍 Capturing Timeline Error Details...\n');

  try {
    const testId = '1d98db6e-9da8-4988-99a1-ebd20e4890cf';
    
    // Test with exact same data structure that might cause issues
    console.log('1️⃣  Testing with problematic data patterns:');
    
    // Test 1: Empty FormData (might cause issues)
    console.log('\n   🧪 Testing with empty FormData:');
    try {
      const emptyFormData = new FormData();
      const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'POST',
        body: emptyFormData
      });
      
      console.log(`      📊 Status: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`      ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`      ❌ Network error: ${error.message}`);
    }

    // Test 2: FormData with undefined values (might cause issues)
    console.log('\n   🧪 Testing with undefined values:');
    try {
      const formData = new FormData();
      formData.append('text', 'Test');
      formData.append('type', undefined); // This might cause issues
      formData.append('location', null); // This might cause issues
      
      const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'POST',
        body: formData
      });
      
      console.log(`      📊 Status: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`      ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`      ❌ Network error: ${error.message}`);
    }

    // Test 3: FormData with large file (might cause memory issues)
    console.log('\n   🧪 Testing with large file:');
    try {
      // Create a large test file (1MB)
      const largeArray = new Uint8Array(1024 * 1024);
      const largeFile = new File([largeArray], 'large-test.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('text', 'Test with large file');
      formData.append('media', largeFile);
      
      const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'POST',
        body: formData
      });
      
      console.log(`      📊 Status: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`      ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`      ❌ Network error: ${error.message}`);
    }

    // Test 4: Check if the issue is with the specific ID
    console.log('\n   🧪 Testing with different timeline ID:');
    try {
      const newTestId = 'test-timeline-' + Date.now();
      const formData = new FormData();
      formData.append('text', 'Test with new ID');
      formData.append('type', 'pet');
      
      const response = await fetch(`http://localhost:3000/api/timeline/${newTestId}`, {
        method: 'POST',
        body: formData
      });
      
      console.log(`      📊 Status: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`      ❌ Error: ${errorText}`);
      } else {
        console.log(`      ✅ New ID works fine`);
      }
    } catch (error) {
      console.log(`      ❌ Network error: ${error.message}`);
    }

    console.log('\n💡 Possible causes of 500 error:');
    console.log('   1. Frontend sending different data format than expected');
    console.log('   2. File upload size limits exceeded');
    console.log('   3. Invalid FormData structure');
    console.log('   4. Database connection issues');
    console.log('   5. S3 upload failures');
    console.log('   6. Memory issues with large files');

  } catch (error) {
    console.error('❌ Capture failed:', error);
  }
}

captureTimelineError();
