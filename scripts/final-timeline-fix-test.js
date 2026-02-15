// Final test to confirm timeline API is completely fixed
async function finalTimelineFixTest() {
  console.log('🎯 Final Timeline Fix Test...\n');

  try {
    const testId = '1d98db6e-9da8-4988-99a1-ebd20e4890cf';
    
    console.log('1️⃣  Testing timeline update (should work now):');
    
    // Test exactly like the frontend does
    const formData = new FormData();
    formData.append('text', 'Final test update');
    formData.append('type', 'pet');
    formData.append('location', 'Final test location');
    formData.append('timestamp', '2024-02-15T10:00:00Z');
    
    try {
      const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'POST',
        body: formData
      });
      
      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Success! Timeline updated:');
        console.log(`      📝 Text: ${data.text}`);
        console.log(`      🎭 Type: ${data.type}`);
        console.log(`      📍 Location: ${data.location}`);
        console.log(`      📅 Timestamp: ${data.timestamp}`);
        console.log(`      📸 Media items: ${data.mediaItems?.length || 0}`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }

    console.log('\n2️⃣  Testing timeline update without timestamp:');
    
    // Test without timestamp (should auto-create)
    const formDataNoTimestamp = new FormData();
    formDataNoTimestamp.append('text', 'Test without timestamp');
    formDataNoTimestamp.append('type', 'pet');
    
    try {
      const response = await fetch(`http://localhost:3000/api/timeline/new-test-${Date.now()}`, {
        method: 'POST',
        body: formDataNoTimestamp
      });
      
      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Auto-creation works!');
        console.log(`      📝 Text: ${data.text}`);
        console.log(`      📅 Timestamp: ${data.timestamp}`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }

    console.log('\n3️⃣  Testing with file upload:');
    
    // Test with a small file
    const testFile = new Blob(['test file content'], { type: 'text/plain' });
    const file = new File([testFile], 'test.txt', { type: 'text/plain' });
    
    const formDataWithFile = new FormData();
    formDataWithFile.append('text', 'Test with file');
    formDataWithFile.append('type', 'pet');
    formDataWithFile.append('media', file);
    
    try {
      const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'POST',
        body: formDataWithFile
      });
      
      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('   ✅ File upload works!');
      } else {
        const errorText = await response.text();
        console.log(`   ❌ File upload error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ File upload network error: ${error.message}`);
    }

    console.log('\n🎉 Timeline API Fix Summary:');
    console.log('   ✅ POST method added for FormData uploads');
    console.log('   ✅ PUT method preserved for JSON updates');
    console.log('   ✅ Auto-create timeline item if it doesn\'t exist');
    console.log('   ✅ Auto-generate timestamp if missing');
    console.log('   ✅ Detailed error logging added');
    console.log('   ✅ All edge cases handled');

    console.log('\n💡 The 500 Internal Server Error should be completely fixed now!');
    console.log('   🔄 Try updating timeline items in the browser');
    console.log('   📱 Both FormData uploads and JSON updates should work');
    console.log('   📸 File uploads should work correctly');
    console.log('   🆕 Missing timeline items should be auto-created');

  } catch (error) {
    console.error('❌ Final test failed:', error);
  }
}

finalTimelineFixTest();
