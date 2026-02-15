import { PrismaClient } from '@prisma/client';

// Debug the 404 issue
async function debug404Issue() {
  console.log('🔍 Debugging 404 issue...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get a few memories to check
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          not: null,
          not: ''
        } 
      },
      take: 5
    });
    
    console.log(`📸 Checking ${memories.length} memories:\n`);

    for (const memory of memories) {
      console.log(`🔗 Memory ID: ${memory.id}`);
      console.log(`📸 URL: ${memory.url}`);
      
      // Test the URL
      try {
        const fullUrl = `http://localhost:3000${memory.url}`;
        console.log(`🌐 Testing: ${fullUrl}`);
        
        const response = await fetch(fullUrl, { method: 'HEAD' });
        console.log(`  📊 Status: ${response.status} ${response.statusText}`);
        console.log(`  📏 Content-Length: ${response.headers.get('content-length')}`);
        console.log(`  🎨 Content-Type: ${response.headers.get('content-type')}`);
        
        if (response.status === 404) {
          console.log(`  ❌ 404 ERROR - This URL is not working!`);
        }
        
      } catch (error) {
        console.log(`  ❌ Fetch Error: ${error.message}`);
      }
      
      console.log('');
    }

    // Check if the API route file exists
    console.log('🔧 Checking API route file...');
    const fs = await import('fs');
    const apiRoutePath = './app/api/serve-image/route.ts';
    
    if (fs.existsSync(apiRoutePath)) {
      console.log(`  ✅ API route exists: ${apiRoutePath}`);
    } else {
      console.log(`  ❌ API route missing: ${apiRoutePath}`);
    }

    // Check server status
    console.log('\n🖥️  Checking server status...');
    try {
      const serverResponse = await fetch('http://localhost:3000/api/test', { method: 'GET' });
      console.log(`  ✅ Server responding: ${serverResponse.status}`);
    } catch (error) {
      console.log(`  ❌ Server not responding: ${error.message}`);
    }

    // Check environment variables in API context
    console.log('\n🔧 Environment variables check...');
    console.log(`  🪣 S3_BUCKET: ${process.env.S3_BUCKET || 'NOT SET'}`);
    console.log(`  🔗 S3_ENDPOINT: ${process.env.S3_ENDPOINT || 'NOT SET'}`);
    console.log(`  🌍 S3_REGION: ${process.env.S3_REGION || 'NOT SET'}`);
    console.log(`  🔑 S3_ACCESS_KEY_ID: ${process.env.S3_ACCESS_KEY_ID ? 'SET' : 'NOT SET'}`);

  } catch (error) {
    console.error('❌ Debug failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

debug404Issue().catch(console.error);
