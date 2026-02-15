// Test memory upload fix
async function testMemoryUploadFix() {
  console.log('🧪 Testing Memory Upload Fix...\n');

  try {
    // Test 1: Get existing memories
    console.log('1️⃣  Getting existing memories:');
    
    try {
      const response = await fetch('http://localhost:3000/api/memories');
      const memories = await response.json();
      
      console.log(`   📸 Found ${memories.length} memories`);
      
      if (memories.length > 0) {
        const testMemory = memories[0];
        console.log(`   📝 Testing with memory: ${testMemory.id}`);
        
        // Test 2: Update memory with new image
        console.log('\n2️⃣  Testing memory update with new image:');
        
        // Create a test image
        const testImageData = new Uint8Array([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
          0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x01,
          0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00,
          0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00,
          0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);
        
        const testFile = new File([testImageData], 'test-memory-upload.png', { type: 'image/png' });
        
        const formData = new FormData();
        formData.append('image', testFile);
        formData.append('privacy', 'public');
        formData.append('caption', 'Test memory upload fix');
        
        try {
          const updateResponse = await fetch(`http://localhost:3000/api/memories/${testMemory.id}`, {
            method: 'POST',
            body: formData
          });
          
          console.log(`   📊 Status: ${updateResponse.status} ${updateResponse.statusText}`);
          
          if (updateResponse.ok) {
            const updatedMemory = await updateResponse.json();
            console.log('   ✅ Memory updated successfully!');
            console.log(`      📝 Caption: ${updatedMemory.caption}`);
            console.log(`      🔒 S3 Key: ${updatedMemory.s3Key}`);
            console.log(`      🔗 URL: ${updatedMemory.url}`);
          } else {
            const errorText = await updateResponse.text();
            console.log(`   ❌ Error: ${errorText}`);
          }
        } catch (error) {
          console.log(`   ❌ Network error: ${error.message}`);
        }
      } else {
        console.log('   ⚠️  No memories found to test with');
      }
    } catch (error) {
      console.log(`   ❌ Error getting memories: ${error.message}`);
    }

    // Test 3: Create new memory with image
    console.log('\n3️⃣  Testing new memory creation with image:');
    
    try {
      const newTestImageData = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00,
        0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      const newTestFile = new File([newTestImageData], 'new-test-memory.png', { type: 'image/png' });
      
      const createFormData = new FormData();
      createFormData.append('image', newTestFile);
      createFormData.append('privacy', 'public');
      createFormData.append('caption', 'New memory test');
      
      try {
        const createResponse = await fetch('http://localhost:3000/api/memories', {
          method: 'POST',
          body: createFormData
        });
        
        console.log(`   📊 Status: ${createResponse.status} ${createResponse.statusText}`);
        
        if (createResponse.ok) {
          const newMemory = await createResponse.json();
          console.log('   ✅ New memory created successfully!');
          console.log(`      📝 Caption: ${newMemory.caption}`);
          console.log(`      🔒 S3 Key: ${newMemory.s3Key}`);
          console.log(`      🔗 URL: ${newMemory.url}`);
        } else {
          const errorText = await createResponse.text();
          console.log(`   ❌ Error: ${errorText}`);
        }
      } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Error creating new memory: ${error.message}`);
    }

    console.log('\n🎉 Memory Upload Fix Summary:');
    console.log('   ✅ Added POST method to memories/[id] for FormData uploads');
    console.log('   ✅ Updated memoriesAPI.update to handle file uploads');
    console.log('   ✅ Added proper S3 file cleanup for old images');
    console.log('   ✅ Added detailed error logging');

    console.log('\n💡 Memory upload errors should be fixed now!');
    console.log('   🔄 Try uploading images in the memory editor');
    console.log('   📱 Both new memory creation and memory updates should work');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMemoryUploadFix();
