// Test URL conversion logic
function testUrlConversion() {
  console.log('🧪 Testing URL conversion logic...\n');

  // Simulate the getDisplayUrl function logic
  const getDisplayUrl = (url) => {
    if (!url) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%23f9fafb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";
    // If it's an Instagram post URL, proxy through our backend
    if (/instagram\.com\/(p|reel|tv)\//.test(url)) {
      return `/api/instagram/image?url=${encodeURIComponent(url)}`;
    }
    // If it's a relative API URL, convert to full URL
    if (url.startsWith('/api/')) {
      return `http://localhost:3000${url}`;
    }
    return url;
  };

  // Test cases
  const testUrls = [
    '/api/serve-image?key=gallery/test.jpg',
    'https://instagram.com/p/test',
    'https://example.com/image.jpg',
    '',
    null
  ];

  console.log('📋 Test Results:');
  testUrls.forEach((url, index) => {
    const result = getDisplayUrl(url || '');
    console.log(`  ${index + 1}. Input: ${url || 'null/empty'}`);
    console.log(`     Output: ${result}`);
    console.log('');
  });

  console.log('✅ URL conversion logic test complete');
}

testUrlConversion();
