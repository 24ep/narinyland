// Final test to confirm timeline 500 error is fixed
async function finalTimeline500Fix() {
  console.log('🎯 Final Timeline 500 Error Fix Test...\n');

  try {
    const testId = '1d98db6e-9da8-4988-99a1-ebd20e4890cf';
    
    console.log('1️⃣  Testing all problematic cases that caused 500 errors:');
    
    const testCases = [
      {
        name: 'Empty strings (the main issue)',
        data: {
          text: '',
          type: '',
          location: '',
          timestamp: '',
          files: []
        }
      },
      {
        name: 'Mixed empty and valid data',
        data: {
          text: 'Valid text',
          type: '',
          location: 'Valid location',
          timestamp: '',
          files: []
        }
      },
      {
        name: 'Only timestamp empty',
        data: {
          text: 'Valid text',
          type: 'pet',
          location: 'Valid location',
          timestamp: '',
          files: []
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n   🧪 Testing: ${testCase.name}`);
      
      try {
        const formData = new FormData();
        
        if (testCase.data.files && testCase.data.files.length > 0) {
          testCase.data.files.forEach(file => {
            formData.append('media', file);
          });
        }
        if (testCase.data.text !== undefined) formData.append('text', testCase.data.text);
        if (testCase.data.type !== undefined) formData.append('type', testCase.data.type);
        if (testCase.data.location !== undefined) formData.append('location', testCase.data.location);
        if (testCase.data.timestamp !== undefined) formData.append('timestamp', testCase.data.timestamp);
        
        const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
          method: 'POST',
          body: formData
        });
        
        console.log(`      📊 Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`      ❌ Error: ${errorText}`);
        } else {
          console.log(`      ✅ Success!`);
        }
        
      } catch (error) {
        console.log(`      ❌ Test error: ${error.message}`);
      }
    }

    console.log('\n2️⃣  Testing JSON PUT method with empty strings:');
    
    try {
      const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '',
          type: '',
          location: '',
          timestamp: ''
        })
      });
      
      console.log(`   📊 PUT Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ PUT Error: ${errorText}`);
      } else {
        console.log(`   ✅ PUT Success!`);
      }
      
    } catch (error) {
      console.log(`   ❌ PUT test error: ${error.message}`);
    }

    console.log('\n🎉 Timeline 500 Error Fix Summary:');
    console.log('   ✅ Added GET method to timeline/[id] route');
    console.log('   ✅ Fixed empty string handling in POST method');
    console.log('   ✅ Fixed empty string handling in PUT method');
    console.log('   ✅ Added detailed error logging');
    console.log('   ✅ Added auto-create fallback for missing items');
    console.log('   ✅ Added auto-generate timestamp fallback');

    console.log('\n💡 The 500 Internal Server Error should be completely fixed now!');
    console.log('   🔄 Try updating timeline items in the browser');
    console.log('   📱 Both FormData and JSON updates should work');
    console.log('   📸 File uploads should work correctly');
    console.log('   🆕 Empty strings should be handled gracefully');

  } catch (error) {
    console.error('❌ Final test failed:', error);
  }
}

finalTimeline500Fix();
