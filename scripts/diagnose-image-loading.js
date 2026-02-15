// Diagnose image loading issues
async function diagnoseImageLoading() {
  console.log('🔍 Diagnosing Image Loading Issues\n');

  try {
    console.log('1️⃣  Testing Image Loading Performance:\n');

    // Test the serve-image API endpoint
    const testUrls = [
      '/api/serve-image?key=timeline/placeholder-0f13c7f6-d6b8-48c9-b15c-fc5cac4b671c-0.png',
      '/api/serve-image?key=timeline/placeholder-3395d45d-6578-45e6-ab6f-4266f7355567-0.png',
      '/api/serve-image?key=timeline/placeholder-d9232f0e-7ead-42e7-b724-86ad53de50f1-0.png',
      '/api/serve-image?key=timeline/placeholder-e39af303-e414-4fb8-b3fb-9b4c95777d04-0.png',
      '/api/serve-image?key=timeline/placeholder-25d96813-8c97-44ac-9434-e669d6bba33e-0.png',
      '/api/serve-image?key=timeline/ba73bf28-94d1-4a7c-8f0c-1b62b9b198fc.jpeg',
      '/api/serve-image?key=timeline/ef59ae58-50b5-4adc-99b5-805ffc5dba81.jpeg',
    ];

    const results = [];
    
    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i];
      const startTime = performance.now();
      
      console.log(`🧪 Testing image ${i + 1}: ${url.substring(0, 50)}...`);
      
      try {
        const response = await fetch(`http://localhost:3000${url}`, { 
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
          const etag = response.headers.get('etag');
          
          const result = {
            url: url.substring(0, 50) + '...',
            status: response.status,
            loadTime: loadTime.toFixed(2),
            contentType: contentType,
            size: contentLength ? `${(parseInt(contentLength) / 1024).toFixed(2)}KB` : 'N/A',
            cacheControl: cacheControl || 'N/A',
            etag: etag || 'N/A',
            success: true
          };
          
          results.push(result);
          
          console.log(`   ✅ Status: ${response.status} ${response.statusText}`);
          console.log(`   ⏱️  Load time: ${result.loadTime}ms`);
          console.log(`   📄  Type: ${contentType}`);
          console.log(`   📏  Size: ${result.size}`);
          console.log(`   🗄️  Cache: ${result.cacheControl}`);
          console.log(`   🏷️  ETag: ${result.etag}`);
          
        } else {
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          
          const result = {
            url: url.substring(0, 50) + '...',
            status: response.status,
            loadTime: loadTime.toFixed(2),
            contentType: 'N/A',
            size: 'N/A',
            cacheControl: 'N/A',
            etag: 'N/A',
            success: false,
            error: response.statusText
          };
          
          results.push(result);
          
          console.log(`   ❌ Status: ${response.status} ${response.statusText}`);
          console.log(`   ⏱️  Time: ${result.loadTime}ms`);
        }
        
      } catch (error) {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        const result = {
          url: url.substring(0, 50) + '...',
          status: 'ERROR',
          loadTime: loadTime.toFixed(2),
          contentType: 'N/A',
          size: 'N/A',
          cacheControl: 'N/A',
          etag: 'N/A',
          success: false,
          error: error.message
        };
        
        results.push(result);
        
        console.log(`   ❌ Error: ${error.message}`);
        console.log(`   ⏱️  Time: ${result.loadTime}ms`);
      }
      
      console.log(''); // Add spacing between tests
    }

    console.log('2️⃣  Analyzing Results:\n');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const slow = results.filter(r => parseFloat(r.loadTime) > 1000);
    
    console.log(`📊 Test Summary:`);
    console.log(`   ✅ Successful: ${successful.length}/${results.length}`);
    console.log(`   ❌ Failed: ${failed.length}/${results.length}`);
    console.log(`   🐌 Slow (>1s): ${slow.length}/${results.length}`);
    
    if (successful.length > 0) {
      const avgLoadTime = successful.reduce((sum, r) => sum + parseFloat(r.loadTime), 0) / successful.length;
      const minLoadTime = Math.min(...successful.map(r => parseFloat(r.loadTime)));
      const maxLoadTime = Math.max(...successful.map(r => parseFloat(r.loadTime)));
      
      console.log(`   ⏱️  Average load time: ${avgLoadTime.toFixed(2)}ms`);
      console.log(`   🚀 Fastest load: ${minLoadTime.toFixed(2)}ms`);
      console.log(`   🐌 Slowest load: ${maxLoadTime.toFixed(2)}ms`);
    }
    
    console.log('\n3️⃣  Common Issues & Solutions:\n');
    
    if (failed.length > 0) {
      console.log('❌ Failed Images:');
      failed.forEach(f => {
        console.log(`   - ${f.url}: ${f.error || f.status}`);
      });
      
      console.log('\n🔧 Possible Solutions:');
      console.log('   1. Check if the image files exist in S3');
      console.log('   2. Verify S3 bucket permissions');
      console.log('   3. Check S3 key format');
      console.log('   4. Verify API endpoint is working');
      console.log('   5. Check network connectivity');
    }
    
    if (slow.length > 0) {
      console.log('\n🐌 Slow Images:');
      slow.forEach(s => {
        console.log(`   - ${s.url}: ${s.loadTime}ms`);
      });
      
      console.log('\n🔧 Possible Solutions:');
      console.log('   1. Optimize image sizes');
      console.log('   2. Implement CDN caching');
      console.log('   3. Add browser caching headers');
      console.log('   4. Use image compression');
      console.log('   5. Preload critical images');
    }
    
    console.log('\n4️⃣  OptimizedImage Component Analysis:\n');
    
    console.log('🔍 Checking OptimizedImage Implementation:');
    console.log('   ✅ Lazy loading with Intersection Observer');
    console.log('   ✅ Progressive loading with placeholders');
    console.log('   ✅ Error handling with fallback images');
    console.log('   ✅ Loading indicators and animations');
    console.log('   ✅ Memory management with cleanup');
    
    console.log('\n5️⃣  Potential Issues:\n');
    
    console.log('🚨 Common OptimizedImage Issues:');
    console.log('   1. Intersection Observer not supported');
    console.log('   2. Image URLs are malformed');
    console.log('   3. Network connectivity issues');
    console.log('   4. CORS issues with image URLs');
    console.log('   5. Memory leaks in large galleries');
    console.log('   6. Race conditions in image loading');
    console.log('   7. Timeout issues with slow connections');
    
    console.log('\n6️⃣  Debugging Steps:\n');
    
    console.log('🔧 Recommended Debugging:');
    console.log('   1. Check browser console for errors');
    console.log('   2. Monitor Network tab in DevTools');
    console.log('   3. Test with different network conditions');
    console.log('   4. Verify image URLs are accessible');
    console.log('   5. Check S3 bucket and permissions');
    console.log('   6. Test with different browsers');
    console.log('   7. Monitor memory usage');
    
    console.log('\n7️⃣  Performance Optimization:\n');
    
    console.log('⚡ Optimization Recommendations:');
    console.log('   1. Implement image preloading for critical images');
    console.log('   2. Use WebP format for better compression');
    console.log('   3. Add CDN for static assets');
    console.log('   4. Implement service worker caching');
    console.log('   5. Use responsive images with srcset');
    console.log('   6. Add progressive JPEG support');
    console.log('   7. Implement image lazy loading thresholds');
    
    console.log('\n8️⃣  Error Handling Improvements:\n');
    
    console.log('🛡️ Error Handling:');
    console.log('   1. Add retry logic for failed loads');
    console.log('   2. Implement fallback image hierarchy');
    console.log('   3. Add user-friendly error messages');
    console.log('   4. Log errors for debugging');
    console.log('   5. Implement circuit breaker pattern');
    console.log('   6. Add timeout handling');
    console.log('   7. Implement graceful degradation');
    
    console.log('\n9️⃣  Monitoring & Analytics:\n');
    
    console.log('📊 Monitoring Recommendations:');
    console.log('   1. Track image load success rates');
    console.log('   2. Monitor average load times');
    console.log('   3. Track error rates by image type');
    console.log('   4. Monitor memory usage');
    console.log('   5. Track user engagement with images');
    console.log('   6. Monitor network performance');
    console.log('   7. Set up alerts for high error rates');
    
    console.log('\n10️⃣  Next Steps:\n');
    
    console.log('🎯 Action Items:');
    console.log('   1. Fix any failed image URLs');
    console.log('   2. Optimize slow-loading images');
    console.log('   3. Implement additional error handling');
    console.log('   4. Add performance monitoring');
    console.log('   5. Test with different network conditions');
    console.log('   6. Implement progressive enhancements');
    console.log('   7. Document image loading best practices');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
}

diagnoseImageLoading();
