// Simple image path check
async function simplePathCheck() {
  console.log('🔍 Simple Image Path Check...\n');

  try {
    // Get config data
    const response = await fetch('http://localhost:3000/api/config');
    const config = await response.json();
    
    console.log(`📸 Total images: ${config.gallery.length}`);
    
    // Show first 5 image paths
    console.log('\n📸 Sample Image Paths:');
    config.gallery.slice(0, 5).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.url}`);
    });

    // Analyze path patterns
    const apiServeImage = config.gallery.filter(item => item.url.startsWith('/api/serve-image')).length;
    console.log(`\n📊 Path Analysis:`);
    console.log(`  /api/serve-image paths: ${apiServeImage}`);
    console.log(`  Other paths: ${config.gallery.length - apiServeImage}`);

    // Test one image path
    const sampleItem = config.gallery[0];
    const displayUrl = `http://localhost:3000${sampleItem.url}`;
    
    console.log(`\n🧪 Testing: ${sampleItem.url}`);
    console.log(`🌐 Full URL: ${displayUrl}`);
    
    try {
      const testResponse = await fetch(displayUrl, { method: 'HEAD' });
      console.log(`✅ Status: ${testResponse.status} ${testResponse.statusText}`);
      console.log(`📏 Size: ${testResponse.headers.get('content-length')} bytes`);
      console.log(`🎨 Type: ${testResponse.headers.get('content-type')}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n🎯 Image Path Flow:');
    console.log('  🗄️  Database: /api/serve-image?key=gallery/[filename]');
    console.log('  🌐 Frontend: http://localhost:3000/api/serve-image?key=gallery/[filename]');
    console.log('  🔧 API Route: Extract key → Fetch from S3 → Return image');
    console.log('  📦 S3 Storage: gallery/[filename] in t3.storageapi.dev bucket');

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

simplePathCheck();
