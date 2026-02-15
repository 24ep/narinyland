// Test image API
async function testImageAPI() {
  console.log('🔍 Testing Image API\n');

  try {
    // Test environment variables
    console.log('🔧 Environment Variables:');
    console.log('   S3_BUCKET: ' + (process.env.S3_BUCKET || 'NOT_SET'));
    console.log('   S3_ENDPOINT: ' + (process.env.S3_ENDPOINT || 'NOT_SET'));
    
    // Test API endpoints
    const testUrls = [
      'http://localhost:3000/api/serve-image?key=timeline/placeholder-0f13c7f6-d6b8-48c9-b15c-fc5cac4b671c-0.png',
      'http://localhost:3000/api/serve-image?key=timeline/placeholder-3395d45d-6578-45e6-ab6f-4266f7355567-0.png',
      'http://localhost:3000/api/serve-image?key=timeline/placeholder-d9232f0e-7ead-42e7-b724-86ad53de50f1-0.png',
      'http://localhost:3000/api/serve-image?key=timeline/placeholder-e39af303-e414-4fb8-b3fb-9b4c95777d04-0.png',
      'http://localhost:3000/api/serve-image?key=timeline/placeholder-25d96813-8c97-44ac-9434-e669d6bba33e-0.png',
      'http://localhost:3000/api/serve-image?key=timeline/ba73bf28-94d1-4a7c-8f0c-1b62b9b198fc.jpeg',
      'http://localhost:3000/api/serve-image?key=timeline/ef59ae58-50b5-4adc-99b5-805ffc5dba81.jpeg',
    ];

    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i];
      const startTime = performance.now();
      
      try {
        const response = await fetch(url);
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        if (response.ok) {
          successCount++;
          console.log('✅ Image ' + (i + 1) + ': SUCCESS (' + loadTime.toFixed(2) + 'ms)');
        } else {
          failCount++;
          console.log('❌ Image ' + (i + 1) + ': FAILED (' + response.status + ')');
        }
      } catch (error) {
        failCount++;
        console.log('❌ Image ' + (i + 1) + ': ERROR (' + error.message + ')');
      }
    }
    
    console.log('\n📊 Results:');
    console.log('   ✅ Success: ' + successCount + '/' + testUrls.length);
    console.log('   ❌ Failed: ' + failCount + '/' + testUrls.length);
    
    if (failCount > 0) {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Check if server is running on localhost:3000');
      console.log('   2. Verify S3 bucket contains the image files');
      console.log('   3. Check S3 credentials in .env file');
      console.log('   4. Check S3 bucket permissions');
      console.log('   5. Check network connectivity');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImageAPI();
