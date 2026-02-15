// Debug what the browser is actually requesting
async function debugBrowserRequests() {
  console.log('🔍 Debugging browser requests...\n');

  try {
    // Test the exact URLs the frontend would use
    const testUrls = [
      'http://localhost:3000/api/serve-image?key=gallery/6fc8de69-4bec-4fa2-a95d-3c12fa99d858.jpg',
      'http://localhost:3000/api/serve-image?key=gallery/placeholder-1.svg',
      'http://localhost:3000/api/serve-image?key=gallery/cdabb774-7bdf-4d00-88d0-43d43572aaea.jpg'
    ];

    console.log('🧪 Testing image URLs directly:');
    
    for (const url of testUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        console.log(`  ✅ ${url.substring(0, 60)}... - ${response.status} ${response.statusText}`);
        console.log(`     📏 Size: ${response.headers.get('content-length')} bytes`);
      } catch (error) {
        console.log(`  ❌ ${url.substring(0, 60)}... - ERROR: ${error.message}`);
      }
    }

    // Check if the main page loads correctly
    console.log('\n🌐 Testing main page:');
    try {
      const pageResponse = await fetch('http://localhost:3000', { method: 'HEAD' });
      console.log(`  ✅ Main page: ${pageResponse.status} ${pageResponse.statusText}`);
    } catch (error) {
      console.log(`  ❌ Main page: ERROR: ${error.message}`);
    }

    console.log('\n💡 Browser Debugging Tips:');
    console.log('  1. Open browser dev tools (F12)');
    console.log('  2. Go to Network tab');
    console.log('  3. Refresh the page (Ctrl+F5)');
    console.log('  4. Look for failed image requests (red status codes)');
    console.log('  5. Check if URLs are being called with correct format');
    console.log('  6. Verify the URLs match: /api/serve-image?key=gallery/...');

    console.log('\n🔍 Expected URL Format:');
    console.log('  http://localhost:3000/api/serve-image?key=gallery/[filename]');
    console.log('  NOT: /api/serve-image?key=gallery/[filename] (relative)');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugBrowserRequests();
