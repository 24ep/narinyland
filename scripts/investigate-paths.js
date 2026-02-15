import { PrismaClient } from '@prisma/client';

// Investigate the exact paths and URLs being used
async function investigatePaths() {
  console.log('🔍 Investigating image paths and URLs...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all memories to check their URLs
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          not: null,
          not: ''
        } 
      }
    });
    
    console.log(`📸 Found ${memories.length} memories\n`);

    // Check the exact URLs in database
    console.log('🔍 Database URL Analysis:');
    const urlTypes = {};
    
    for (const memory of memories) {
      const url = memory.url;
      
      if (url.startsWith('/api/serve-image')) {
        urlTypes['api-serve-image'] = (urlTypes['api-serve-image'] || 0) + 1;
        
        // Extract the key parameter
        const urlObj = new URL(`http://localhost:3000${url}`);
        const key = urlObj.searchParams.get('key');
        
        console.log(`  📸 Memory ${memory.id}:`);
        console.log(`    🔗 URL: ${url}`);
        console.log(`    🔑 Key: ${key}`);
        
        // Test the exact URL the browser would use
        const fullUrl = `http://localhost:3000${url}`;
        try {
          const response = await fetch(fullUrl, { method: 'HEAD' });
          console.log(`    🌐 Full URL: ${fullUrl}`);
          console.log(`    📊 Status: ${response.status} ${response.statusText}`);
          console.log(`    📏 Size: ${response.headers.get('content-length')} bytes`);
          console.log(`    🎨 Type: ${response.headers.get('content-type')}`);
        } catch (error) {
          console.log(`    ❌ Error: ${error.message}`);
        }
        console.log('');
        
      } else {
        urlTypes['other'] = (urlTypes['other'] || 0) + 1;
        console.log(`  ⚠️  Non-API URL: ${url}`);
      }
    }

    console.log('📊 URL Type Summary:');
    Object.entries(urlTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    // Check if the API route is actually working
    console.log('\n🔧 API Route Check:');
    
    try {
      const testUrl = 'http://localhost:3000/api/serve-image?key=gallery/placeholder-1.svg';
      const response = await fetch(testUrl, { method: 'HEAD' });
      console.log(`  🧪 Test URL: ${testUrl}`);
      console.log(`  📊 Status: ${response.status} ${response.statusText}`);
      console.log(`  📏 Size: ${response.headers.get('content-length')} bytes`);
      console.log(`  🎨 Type: ${response.headers.get('content-type')}`);
    } catch (error) {
      console.log(`  ❌ API Route Error: ${error.message}`);
    }

    // Check server logs or any issues
    console.log('\n🖥️  Server Status:');
    try {
      const serverResponse = await fetch('http://localhost:3000', { method: 'HEAD' });
      console.log(`  ✅ Server responding: ${serverResponse.status}`);
    } catch (error) {
      console.log(`  ❌ Server not responding: ${error.message}`);
    }

    console.log('\n💡 Investigation Results:');
    console.log('  - Database URLs format: /api/serve-image?key=gallery/...');
    console.log('  - Frontend should convert to: http://localhost:3000/api/serve-image?key=...');
    console.log('  - API route should serve images from t3.storageapi.dev');
    console.log('  - If images still not loading, check browser dev tools Network tab');

  } catch (error) {
    console.error('❌ Investigation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

investigatePaths().catch(console.error);
