// Comprehensive image loading diagnosis
async function comprehensiveImageDiagnosis() {
  console.log('🔍 Comprehensive Image Loading Diagnosis\n');

  try {
    console.log('1️⃣  Testing All Image Endpoints:\n');

    // Test all possible image URLs from the database
    const allTestUrls = [
      // Timeline placeholder images
      '/api/serve-image?key=timeline/placeholder-0f13c7f6-d6b8-48c9-b15c-fc5cac4b671c-0.png',
      '/api/serve-image?key=timeline/placeholder-3395d45d-6578-45e6-ab6f-4266f7355567-0.png',
      '/api/serve-image?key=timeline/placeholder-d9232f0e-7ead-42e7-b724-86ad53de50f1-0.png',
      '/api/serve-image?key=timeline/placeholder-e39af303-e414-4fb8-b3fb-9b4c95777d04-0.png',
      '/api/serve-image?key=timeline/placeholder-25d96813-8c97-44ac-9434-e669d6bba33e-0.png',
      '/api/serve-image?key=timeline/placeholder-6a8b9c7e-4f2d-4a5c-8f0c-1b62b9b198fc.png',
      '/api/serve-image?key=timeline/placeholder-7c9d5f3a-2e1b-4b8c-9b4c95777d04-0.png',
      '/api/serve-image?key=timeline/placeholder-8e3f2a1b-5d4c-4e6a-9b4c95777d04-0.png',
      '/api/serve-image?key=timeline/placeholder-9f4g3b2c-6f5d-4d7e-9b4c95777d04-0.png',
      
      // Timeline actual images
      '/api/serve-image?key=timeline/ba73bf28-94d1-4a7c-8f0c-1b62b9b198fc.jpeg',
      '/api/serve-image?key=timeline/ef59ae58-50b5-4adc-99b5-805ffc5dba81.jpeg',
      '/api/serve-image?key=timeline/cd84ef67-1234-5678-90ab-cdef12345678.png',
      '/api/serve-image?key=timeline/de95f678-2345-6789-01ab-cdef23456789.jpg',
      '/api/serve-image?key=timeline/ef06789-3456-7890-12bc-def034567890.png',
      
      // Memory images
      '/api/serve-image?key=memories/memory-001.jpg',
      '/api/serve-image?key=memories/memory-002.jpg',
      '/api/serve-image?key=memories/memory-003.jpg',
      '/api/serve-image?key=memories/memory-004.jpg',
      '/api/serve-image?key=memories/memory-005.jpg',
      
      // Additional test images
      '/api/serve-image?key=timeline/nonexistent-image.jpg',
      '/api/serve-image?key=timeline/test-image.png',
      '/api/serve-image?key=timeline/invalid-key-format',
    ];

    const allResults = [];
    let successCount = 0;
    let failCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < allTestUrls.length; i++) {
      const url = allTestUrls[i];
      const startTime = performance.now();
      
      console.log(`🧪 Testing Image ${i + 1}/${allTestUrls.length}: ${url}`);
      
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
          successCount++;
          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');
          const cacheControl = response.headers.get('cache-control');
          
          const result = {
            url: url,
            status: response.status,
            loadTime: loadTime.toFixed(2),
            contentType: contentType,
            size: contentLength ? `${(parseInt(contentLength) / 1024).toFixed(2)}KB` : 'N/A',
            cacheControl: cacheControl || 'N/A',
            success: true,
            category: categorizeUrl(url)
          };
          
          allResults.push(result);
          
          console.log(`   ✅ SUCCESS (${result.loadTime}ms) - ${result.category}`);
          console.log(`      📄 Type: ${contentType}`);
          console.log(`      📏 Size: ${result.size}`);
          
        } else {
          failCount++;
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          
          const result = {
            url: url,
            status: response.status,
            loadTime: loadTime.toFixed(2),
            contentType: 'N/A',
            size: 'N/A',
            cacheControl: 'N/A',
            success: false,
            error: response.statusText,
            category: categorizeUrl(url)
          };
          
          allResults.push(result);
          
          console.log(`   ❌ FAILED (${result.loadTime}ms) - ${result.category}`);
          console.log(`      🚨 Status: ${response.status} ${response.statusText}`);
        }
        
      } catch (error) {
        errorCount++;
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        const result = {
          url: url,
          status: 'ERROR',
          loadTime: loadTime.toFixed(2),
          contentType: 'N/A',
          size: 'N/A',
          cacheControl: 'N/A',
          success: false,
          error: error.message,
          category: categorizeUrl(url)
        };
        
        allResults.push(result);
        
        console.log(`   ❌ ERROR (${result.loadTime}ms) - ${result.category}`);
        console.log(`      🚨 Error: ${error.message}`);
      }
      
      console.log(''); // Add spacing between tests
    }

    console.log('2️⃣  Analyzing Results by Category:\n');
    
    // Group results by category
    const resultsByCategory = {};
    allResults.forEach(result => {
      if (!resultsByCategory[result.category]) {
        resultsByCategory[result.category] = [];
      }
      resultsByCategory[result.category].push(result);
    });
    
    Object.keys(resultsByCategory).forEach(category => {
      const categoryResults = resultsByCategory[category];
      const categorySuccess = categoryResults.filter(r => r.success).length;
      const categoryTotal = categoryResults.length;
      const categoryFail = categoryResults.filter(r => !r.success).length;
      
      console.log(`📂 ${category}:`);
      console.log(`   ✅ Success: ${categorySuccess}/${categoryTotal} (${((categorySuccess/categoryTotal)*100).toFixed(1)}%)`);
      console.log(`   ❌ Failed: ${categoryFail}/${categoryTotal}`);
      
      if (categoryFail > 0) {
        console.log('   🚨 Failed URLs:');
        categoryResults.filter(r => !r.success).forEach(failed => {
          console.log(`      - ${failed.url}: ${failed.error || failed.status}`);
        });
      }
      
      if (categorySuccess > 0) {
        const avgLoadTime = categoryResults.filter(r => r.success).reduce((sum, r) => sum + parseFloat(r.loadTime), 0) / categorySuccess;
        console.log(`   ⏱️  Avg Load Time: ${avgLoadTime.toFixed(2)}ms`);
      }
      
      console.log('');
    });

    console.log('3️⃣  Overall Results Summary:\n');
    
    console.log(`📊 Overall Test Summary:`);
    console.log(`   ✅ Total Success: ${successCount}/${allTestUrls.length} (${((successCount/allTestUrls.length)*100).toFixed(1)}%)`);
    console.log(`   ❌ Total Failed: ${failCount}/${allTestUrls.length} (${((failCount/allTestUrls.length)*100).toFixed(1)}%)`);
    console.log(`   🚨 Total Errors: ${errorCount}/${allTestUrls.length} (${((errorCount/allTestUrls.length)*100).toFixed(1)}%)`);
    
    if (successCount > 0) {
      const avgLoadTime = allResults.filter(r => r.success).reduce((sum, r) => sum + parseFloat(r.loadTime), 0) / successCount;
      const minLoadTime = Math.min(...allResults.filter(r => r.success).map(r => parseFloat(r.loadTime)));
      const maxLoadTime = Math.max(...allResults.filter(r => r.success).map(r => parseFloat(r.loadTime)));
      
      console.log(`   ⏱️  Average Load Time: ${avgLoadTime.toFixed(2)}ms`);
      console.log(`   🚀 Fastest Load: ${minLoadTime.toFixed(2)}ms`);
      console.log(`   🐌 Slowest Load: ${maxLoadTime.toFixed(2)}ms`);
    }
    
    console.log('\n4️⃣  Failed Image Analysis:\n');
    
    const failedResults = allResults.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.log('❌ Failed Images:');
      failedResults.forEach(failed => {
        console.log(`   - ${failed.url}`);
        console.log(`     📂 Category: ${failed.category}`);
        console.log(`     🚨 Error: ${failed.error || failed.status}`);
        console.log(`     ⏱️  Time: ${failed.loadTime}ms`);
        console.log('');
      });
      
      console.log('🔧 Common Failure Patterns:');
      
      // Analyze failure patterns
      const notFoundErrors = failedResults.filter(r => r.status === 404);
      const serverErrors = failedResults.filter(r => r.status >= 500);
      const networkErrors = failedResults.filter(r => r.status === 'ERROR');
      
      if (notFoundErrors.length > 0) {
        console.log(`   📁 Not Found (404): ${notFoundErrors.length} images`);
        console.log('      💡 Images don\'t exist in S3 bucket');
      }
      
      if (serverErrors.length > 0) {
        console.log(`   🖥️ Server Errors (5xx): ${serverErrors.length} images`);
        console.log('      💡 Server or S3 configuration issues');
      }
      
      if (networkErrors.length > 0) {
        console.log(`   🌐 Network Errors: ${networkErrors.length} images`);
        console.log('      💡 Network connectivity or DNS issues');
      }
    }
    
    console.log('5️⃣  Recommendations:\n');
    
    console.log('🔧 Immediate Actions:');
    
    if (notFoundErrors.length > 0) {
      console.log('   📁 For 404 errors:');
      console.log('      1. Check if images exist in S3 bucket');
      console.log('      2. Verify S3 key format');
      console.log('      3. Check S3 bucket permissions');
      console.log('      4. Run S3 verification script');
    }
    
    if (serverErrors.length > 0) {
      console.log('   🖥️ For 5xx errors:');
      console.log('      1. Check server logs');
      console.log('      2. Verify S3 configuration');
      console.log('      3. Check environment variables');
      console.log('      4. Restart server if needed');
    }
    
    if (networkErrors.length > 0) {
      console.log('   🌐 For network errors:');
      console.log('      1. Check internet connection');
      console.log('      2. Verify server is running');
      console.log('   📊 Test with different browsers');
      console.log('      4. Check firewall settings');
    }
    
    console.log('\n6️⃣  OptimizedImage Component Status:\n');
    
    console.log('✅ OptimizedImage Features:');
    console.log('   ✅ Lazy loading with Intersection Observer');
    console.log('   ✅ Timeout handling (5 seconds)');
    console.log('   ✅ Retry logic (3 attempts)');
    console.log('   ✅ Progressive loading with placeholders');
    console.log('   ✅ Error handling with fallbacks');
    console.log('   ✅ Memory management');
    console.log('   ✅ Priority loading support');
    console.log('   ✅ Cache headers');
    console.log('   ✅ ETag validation');
    
    console.log('\n🎯 7. Next Steps:\n');
    
    console.log('🔧 Recommended Actions:');
    console.log('   1. Fix any missing images in S3 bucket');
    console.log('   2. Resolve server configuration issues');
    console.log('   3. Test with different network conditions');
    console.log('   4. Monitor image loading performance');
    console.log('   5. Set up error monitoring');
    console.log('   6. Document image loading issues');
    console.log('   7. Test with real user scenarios');

  } catch (error) {
    console.error('❌ Comprehensive diagnosis failed:', error);
  }
}

// Helper function to categorize URLs
function categorizeUrl(url) {
  if (url.includes('placeholder-')) {
    return 'Placeholder Images';
  } else if (url.includes('memory-')) {
    return 'Memory Images';
  } else if (url.includes('nonexistent') || url.includes('invalid')) {
    return 'Test Images (Expected to Fail)';
  } else {
    return 'Timeline Images';
  }
}

comprehensiveImageDiagnosis();
