// Simple image serving diagnosis
async function simpleImageDiagnosis() {
  console.log('🔍 Simple Image Serving Diagnosis\n');

  try {
    console.log('1️⃣  Testing S3 Configuration:\n');

    // Test S3 configuration
    console.log('🔧 S3 Configuration:');
    console.log('   📦 Bucket: ' + (process.env.S3_BUCKET || 'NOT_SET'));
    console.log('   🔗 Endpoint: ' + (process.env.S3_ENDPOINT || 'NOT_SET'));
    console.log('   🔑 Access Key: ' + (process.env.S3_ACCESS_KEY_ID ? 'SET' : 'NOT_SET'));
    console.log('   🔐 Secret Key: ' + (process.env.S3_SECRET_ACCESS_KEY ? 'SET' : 'NOT_SET'));
    console.log('   🌍 Region: ' + (process.env.S3_REGION || 'NOT_SET'));

    // Check if all required env vars are set
    const requiredVars = ['S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET', 'S3_ENDPOINT'];
    const missingVars = requiredVars.filter(var => !process.env[var]);
    
    if (missingVars.length > 0) {
      console.log('\n❌ Missing Environment Variables: ' + missingVars.join(', '));
      console.log('   🔧 Please check your .env file');
      return;
    } else {
      console.log('   ✅ All required S3 environment variables are set');
    }

    console.log('\n2️⃣  Testing Serve-Image API:\n');

    // Test the serve-image API endpoint
    const testKeys = [
      'timeline/placeholder-0f13c7f6-d6b8-48c9-b15c-fc5cac4b671c-0.png',
      'timeline/placeholder-3395d45d-6578-45e6-ab6f-4266f7355567-0.png',
      'timeline/placeholder-d9232f0e-7ead-42e7-b724-86ad53de50f1-0.png',
      'timeline/placeholder-e39af303-e414-4fb8-b3fb-9b4c95777d04-0.png',
      'timeline/placeholder-25d96813-8c97-44ac-9434-e669d6bba33e-0.png',
      'timeline/ba73bf28-94d1-4a7c-8f0c-1b62b9b198fc.jpeg',
      'timeline/ef59ae58-50b5-4adc-99b5-805ffc5dba81.jpeg',
    ];

    const apiResults = [];
    
    for (let i = 0; i < testKeys.length; i++) {
      const key = testKeys[i];
      const startTime = performance.now();
      
      console.log('🧪 Testing API ' + (i + 1) + ': ' + key);
      
      try {
        const response = await fetch('http://localhost:3000/api/serve-image?key=' + encodeURIComponent(key), {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
            'Cache-Control': 'no-cache'
          }
        });
        
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');
          const cacheControl = response.headers.get('cache-control');
          
          const result = {
            key: key,
            status: response.status,
            loadTime: loadTime.toFixed(2),
            contentType: contentType,
            size: contentLength ? (parseInt(contentLength) / 1024).toFixed(2) + 'KB' : 'N/A',
            cacheControl: cacheControl || 'N/A',
            success: true
          };
          
          apiResults.push(result);
          
          console.log('   ✅ Status: ' + response.status + ' ' + response.statusText);
          console.log('   ⏱️  Load time: ' + result.loadTime + 'ms');
          console.log('   📄  Type: ' + contentType);
          console.log('   📏  Size: ' + result.size);
          console.log('   🗄️  Cache: ' + result.cacheControl);
          
        } else {
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          
          const result = {
            key: key,
            status: response.status,
            loadTime: loadTime.toFixed(2),
            contentType: 'N/A',
            size: 'N/A',
            cacheControl: 'N/A',
            success: false,
            error: response.statusText
          };
          
          apiResults.push(result);
          
          console.log('   ❌ Status: ' + response.status + ' ' + response.statusText);
          console.log('   ⏱️  Time: ' + result.loadTime + 'ms');
          console.log('   🚨 Error: ' + result.error);
        }
        
      } catch (error) {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        const result = {
          key: key,
          status: 'ERROR',
          loadTime: loadTime.toFixed(2),
          contentType: 'N/A',
          size: 'N/A',
          cacheControl: 'N/A',
          success: false,
          error: error.message
        };
        
        apiResults.push(result);
        
        console.log('   ❌ Error: ' + error.message);
        console.log('   ⏱️  Time: ' + result.loadTime + 'ms');
      }
      
      console.log(''); // Add spacing between tests
    }

    console.log('3️⃣  Analyzing Results:\n');
    
    const successful = apiResults.filter(r => r.success);
    const failed = apiResults.filter(r => !r.success);
    const slow = apiResults.filter(r => parseFloat(r.loadTime) > 1000);
    
    console.log('📊 Test Summary:');
    console.log('   ✅ Successful: ' + successful.length + '/' + apiResults.length);
    console.log('   ❌ Failed: ' + failed.length + '/' + apiResults.length);
    console.log('   🐌 Slow (>1s): ' + slow.length + '/' + apiResults.length);
    
    if (successful.length > 0) {
      const avgLoadTime = successful.reduce((sum, r) => sum + parseFloat(r.loadTime), 0) / successful.length;
      const minLoadTime = Math.min(...successful.map(r => parseFloat(r.loadTime)));
      const maxLoadTime = Math.max(...successful.map(r => parseFloat(r.loadTime)));
      
      console.log('   ⏱️  Average load time: ' + avgLoadTime.toFixed(2) + 'ms');
      console.log('   🚀 Fastest load: ' + minLoadTime.toFixed(2) + 'ms');
      console.log('   🐌 Slowest load: ' + maxLoadTime.toFixed(2) + 'ms');
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed API Calls:');
      failed.forEach(f => {
        console.log('   - ' + f.key + ': ' + (f.error || f.status));
      });
      
      console.log('\n🔧 Possible Solutions:');
      console.log('   1. Check if image files exist in S3 bucket');
      console.log('   2. Verify S3 bucket permissions');
      console.log('   3. Check S3 key format and encoding');
      console.log('   4. Verify API endpoint is working');
      console.log('   5. Check network connectivity');
      console.log('   6. Verify environment variables');
      console.log('   7. Check S3 bucket region');
    }
    
    console.log('\n4️⃣  Common Issues & Solutions:\n');
    
    console.log('🚨 Common Image Serving Issues:');
    console.log('   1. Missing image files in S3 bucket');
    console.log('   2. Incorrect S3 bucket permissions');
    console.log('   3. Wrong S3 key format');
    console.log('   4. Network connectivity issues');
    console.log('   5. Environment variable problems');
    console.log('   6. S3 bucket region mismatch');
    console.log('   7. API endpoint errors');
    
    console.log('\n🔧 Recommended Solutions:');
    console.log('   1. Verify all image files exist in S3');
    console.log('   2. Check S3 bucket CORS configuration');
    console.log('   3. Verify environment variables are correct');
    console.log('   4. Test S3 bucket permissions');
    console.log('   5. Check S3 bucket region');
    console.log('   6. Verify API endpoint is accessible');
    console.log('   7. Test with different browsers');
    
    console.log('\n🎯 5. Next Steps:\n');
    
    console.log('🎯 Action Items:');
    console.log('   1. Fix any missing image files');
    console.log('   2. Resolve S3 permission issues');
    console.log('   3. Fix environment variable problems');
    console.log('   4. Optimize image serving performance');
    console.log('   5. Implement caching strategies');
    console.log('   6. Add error monitoring');
    console.log('   7. Document image serving process');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
}

simpleImageDiagnosis();
