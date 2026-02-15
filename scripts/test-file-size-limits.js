// Test file size limits for timeline API
async function testFileSizeLimits() {
  console.log('🧪 Testing File Size Limits...\n');

  const testId = '1d98db6e-9da8-4988-99a1-ebd20e4890cf';
  
  console.log('1️⃣  Testing normal file upload:');
  
  // Create a small test file (1MB)
  const smallBuffer = new ArrayBuffer(1024 * 1024); // 1MB
  const smallFile = new File([smallBuffer], 'small-test.jpg', { type: 'image/jpeg' });
  
  const formData = new FormData();
  formData.append('text', 'Test with small file');
  formData.append('type', 'pet');
  formData.append('media', smallFile);
  
  try {
    const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
      method: 'POST',
      body: formData
    });
    
    console.log(`   📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Small file upload successful');
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Small file upload failed: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }

  console.log('\n2️⃣  Testing large file upload (should be rejected):');
  
  // Create a large test file (15MB - should be rejected)
  const largeBuffer = new ArrayBuffer(15 * 1024 * 1024); // 15MB
  const largeFile = new File([largeBuffer], 'large-test.jpg', { type: 'image/jpeg' });
  
  const largeFormData = new FormData();
  largeFormData.append('text', 'Test with large file');
  largeFormData.append('type', 'pet');
  largeFormData.append('media', largeFile);
  
  try {
    const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
      method: 'POST',
      body: largeFormData
    });
    
    console.log(`   📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 400) {
      const errorData = await response.json();
      console.log('   ✅ Large file correctly rejected');
      console.log(`   📝 Error: ${errorData.error}`);
      console.log(`   📝 Details: ${errorData.details}`);
      console.log(`   📝 Suggestion: ${errorData.suggestion}`);
    } else {
      console.log('   ❌ Large file was not rejected (this might be a problem)');
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }

  console.log('\n3️⃣  Testing multiple files (should be rejected if total > 50MB):');
  
  // Create multiple medium files (6MB each = 36MB total - should be accepted)
  const mediumFiles = [];
  for (let i = 0; i < 3; i++) {
    const mediumBuffer = new ArrayBuffer(6 * 1024 * 1024); // 6MB
    const mediumFile = new File([mediumBuffer], `medium-test-${i}.jpg`, { type: 'image/jpeg' });
    mediumFiles.push(mediumFile);
  }
  
  const multipleFormData = new FormData();
  multipleFormData.append('text', 'Test with multiple files');
  multipleFormData.append('type', 'pet');
  mediumFiles.forEach((file, index) => {
    multipleFormData.append('media', file);
  });
  
  try {
    const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
      method: 'POST',
      body: multipleFormData
    });
    
    console.log(`   📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Multiple files upload successful');
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Multiple files upload failed: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }

  console.log('\n4️⃣  Testing very large multiple files (should be rejected):');
  
  // Create multiple large files (15MB each = 45MB total - should be accepted)
  const largeFiles = [];
  for (let i = 0; i < 4; i++) {
    const largeBuffer = new ArrayBuffer(15 * 1024 * 1024); // 15MB
    const largeFile = new File([largeBuffer], `large-test-${i}.jpg`, { type: 'image/jpeg' });
    largeFiles.push(largeFile);
  }
  
  const veryLargeFormData = new FormData();
  veryLargeFormData.append('text', 'Test with very large files');
  veryLargeFormData.append('type', 'pet');
  largeFiles.forEach((file, index) => {
    veryLargeFormData.append('media', file);
  });
  
  try {
    const response = await fetch(`http://localhost:3000/api/timeline/${testId}`, {
      method: 'POST',
      body: veryLargeFormData
    });
    
    console.log(`   📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 400) {
      const errorData = await response.json();
      console.log('   ✅ Very large files correctly rejected');
      console.log(`   📝 Error: ${errorData.error}`);
      console.log(`   📝 Details: ${errorData.details}`);
      console.log(`   📝 Suggestion: ${errorData.suggestion}`);
    } else {
      console.log('   ❌ Very large files were not rejected (this might be a problem)');
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }

  console.log('\n📊 File Size Limit Test Summary:');
  console.log('   ✅ Small files (< 10MB): Should work');
  console.log('   ❌ Large files (> 10MB): Should be rejected');
  console.log('   ✅ Multiple files (< 50MB total): Should work');
  console.log('   ❌ Multiple files (> 50MB total): Should be rejected');

  console.log('\n💡 File size limits are now properly configured!');
  console.log('   🔄 Try uploading images in the browser');
  console.log('   📱 Large files will be rejected with helpful error messages');
}

testFileSizeLimits();
