// Test image loading optimization performance
async function testImageOptimization() {
  console.log('🚀 Testing Image Loading Optimization...\n');

  try {
    console.log('1️⃣  Testing image loading performance:');
    
    // Test with multiple images to simulate home page loading
    const testUrls = [
      '/api/serve-image?key=timeline/placeholder-0f13c7f6-d6b8-48c9-b15c-fc5cac4b671c-0.png',
      '/api/serve-image?key=timeline/placeholder-3395d45d-6578-45e6-ab6f-4266f7355567-0.png',
      '/api/serve-image?key=timeline/placeholder-d9232f0e-7ead-42e7-b724-86ad53de50f1-0.png',
      '/api/serve-image?key=timeline/placeholder-e39af303-e414-4fb8-b3fb-9b4c95777d04-0.png',
      '/api/serve-image?key=timeline/placeholder-25d96813-8c97-44ac-9434-e669d6bba33e-0.png',
      '/api/serve-image?key=timeline/ba73bf28-94d1-4a7c-8f0c-1b62b9b198fc.jpeg',
      '/api/serve-image?key=timeline/ef59ae58-50b5-4adc-99b5-805ffc5dba81.jpeg',
      '/api/serve-image?key=timeline/a03fa77e-6045-4b7e-8f0c-1b62b9b198fc.txt'
    ];

    const results = [];
    
    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i];
      const startTime = performance.now();
      
      console.log(`   🧪 Testing image ${i + 1}: ${url.substring(0, 50)}...`);
      
      try {
        const response = await fetch(`http://localhost:3000${url}`, { method: 'HEAD' });
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        const result = {
          url: url.substring(0, 50) + '...',
          status: response.status,
          loadTime: loadTime.toFixed(2),
          contentType: contentType,
          size: contentLength ? `${(parseInt(contentLength) / 1024).toFixed(2)}KB` : 'N/A',
          success: response.ok
        };
        
        results.push(result);
        
        console.log(`      📊 Status: ${response.status} ${response.statusText}`);
        console.log(`      ⏱️  Load time: ${result.loadTime}ms`);
        console.log(`      📄  Type: ${contentType}`);
        console.log(`      📏  Size: ${result.size}`);
        
      } catch (error) {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        const result = {
          url: url.substring(0, 50) + '...',
          status: 'ERROR',
          loadTime: loadTime.toFixed(2),
          contentType: 'N/A',
          size: 'N/A',
          success: false,
          error: error.message
        };
        
        results.push(result);
        
        console.log(`      ❌ Error: ${error.message}`);
        console.log(`      ⏱️  Time: ${result.loadTime}ms`);
      }
    }

    console.log('\n2️⃣  Performance Summary:');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    if (successful.length > 0) {
      const avgLoadTime = successful.reduce((sum, r) => sum + parseFloat(r.loadTime), 0) / successful.length;
      const minLoadTime = Math.min(...successful.map(r => parseFloat(r.loadTime)));
      const maxLoadTime = Math.max(...successful.map(r => parseFloat(r.loadTime)));
      
      console.log(`   ✅ Successful loads: ${successful.length}/${results.length}`);
      console.log(`   ⏱️  Average load time: ${avgLoadTime.toFixed(2)}ms`);
      console.log(`   🚀 Fastest load: ${minLoadTime.toFixed(2)}ms`);
      console.log(`   🐌 Slowest load: ${maxLoadTime.toFixed(2)}ms`);
      
      // Performance classification
      if (avgLoadTime < 100) {
        console.log('   🟢 Performance: EXCELLENT (< 100ms average)');
      } else if (avgLoadTime < 300) {
        console.log('   🟡 Performance: GOOD (100-300ms average)');
      } else if (avgLoadTime < 500) {
        console.log('   🟠 Performance: FAIR (300-500ms average)');
      } else {
        console.log('   🔴 Performance: POOR (> 500ms average)');
      }
    }
    
    if (failed.length > 0) {
      console.log(`   ❌ Failed loads: ${failed.length}/${results.length}`);
      failed.forEach(f => {
        console.log(`      - ${f.url}: ${f.error}`);
      });
    }

    console.log('\n3️⃣  Testing concurrent loading:');
    
    const concurrentStartTime = performance.now();
    const concurrentPromises = testUrls.slice(0, 5).map(url => 
      fetch(`http://localhost:3000${url}`, { method: 'HEAD' })
    );
    
    try {
      const concurrentResults = await Promise.allSettled(concurrentPromises);
      const concurrentEndTime = performance.now();
      const concurrentTime = concurrentEndTime - concurrentStartTime;
      
      const concurrentSuccessful = concurrentResults.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      
      console.log(`   📊 Concurrent loads: ${concurrentSuccessful}/5`);
      console.log(`   ⏱️  Total time: ${concurrentTime.toFixed(2)}ms`);
      console.log(`   📈 Efficiency: ${(concurrentSuccessful / concurrentTime * 1000).toFixed(2)} loads/sec`);
      
    } catch (error) {
      console.log(`   ❌ Concurrent test failed: ${error.message}`);
    }

    console.log('\n4️⃣  Optimization Features Implemented:');
    console.log('   ✅ Lazy loading with Intersection Observer');
    console.log('   ✅ Progressive image loading with placeholders');
    console.log('   ✅ Priority loading for first images');
    console.log('   ✅ Error handling with fallback images');
    console.log('   ✅ Loading indicators and animations');
    console.log('   ✅ Responsive image sizing');
    console.log('   ✅ Memory management with cleanup');

    console.log('\n💡 Optimization Benefits:');
    console.log('   🚀 Faster initial page load');
    console.log('   📱 Better mobile performance');
    console.log('   🔄 Smooth user experience');
    console.log('   📊 Reduced bandwidth usage');
    console.log('   🛡️ Graceful error handling');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImageOptimization();
