// Simulate what the frontend does
async function simulateFrontend() {
  console.log('🎭 Simulating frontend behavior...\n');

  try {
    // Step 1: Get config from API (what frontend does)
    console.log('1️⃣  Getting config from API...');
    const configResponse = await fetch('http://localhost:3000/api/config');
    const config = await configResponse.json();
    
    console.log(`   ✅ Got config with ${config.gallery.length} gallery items`);
    
    // Step 2: Test getDisplayUrl function (what MemoryFrame does)
    console.log('\n2️⃣  Testing URL conversion...');
    
    const getDisplayUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('/api/')) {
        return `http://localhost:3000${url}`;
      }
      return url;
    };
    
    // Test first 3 gallery items
    for (let i = 0; i < Math.min(3, config.gallery.length); i++) {
      const item = config.gallery[i];
      const displayUrl = getDisplayUrl(item.url);
      
      console.log(`   📸 Item ${i + 1}: ${item.url}`);
      console.log(`   🌐 Display URL: ${displayUrl}`);
      
      // Test if the image loads
      try {
        const imgResponse = await fetch(displayUrl, { method: 'HEAD' });
        console.log(`   ✅ Status: ${imgResponse.status} ${imgResponse.statusText}`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log('');
    }

    console.log('🎉 Frontend simulation complete!');
    console.log('📸 Images should be loading in the browser now.');

  } catch (error) {
    console.error('❌ Simulation failed:', error);
  }
}

simulateFrontend();
