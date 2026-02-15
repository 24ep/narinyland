import { PrismaClient } from '@prisma/client';

// Final check of all photos
async function finalPhotoCheck() {
  console.log('🎯 Final Photo Check...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all memories
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          not: null,
          not: ''
        } 
      }
    });
    
    console.log(`📸 Total memories: ${memories.length}`);

    // Check URL types
    const apiUrls = memories.filter(m => m.url.startsWith('/api/serve-image'));
    const otherUrls = memories.filter(m => !m.url.startsWith('/api/serve-image'));
    
    console.log(`\n📊 URL Distribution:`);
    console.log(`  🟢 API URLs: ${apiUrls.length}`);
    console.log(`  ⚪ Other URLs: ${otherUrls.length}`);

    // Test all API URLs
    console.log(`\n🧪 Testing all ${apiUrls.length} API URLs:`);
    
    let working = 0;
    let failed = 0;
    
    for (const memory of apiUrls) {
      try {
        const response = await fetch(`http://localhost:3000${memory.url}`, { method: 'HEAD' });
        
        if (response.ok) {
          working++;
          if (working <= 5) { // Show first 5
            console.log(`  ✅ ${memory.url.substring(0, 60)}... - ${response.status}`);
          }
        } else {
          failed++;
          console.log(`  ❌ ${memory.url.substring(0, 60)}... - ${response.status}`);
        }
      } catch (error) {
        failed++;
        console.log(`  ❌ ${memory.url.substring(0, 60)}... - ERROR: ${error.message}`);
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`  ✅ Working: ${working} photos`);
    console.log(`  ❌ Failed: ${failed} photos`);
    console.log(`  📊 Success Rate: ${Math.round((working / apiUrls.length) * 100)}%`);

    // Show sample URLs
    console.log(`\n🔍 Sample Working URLs:`);
    const workingSamples = await prisma.memory.findMany({
      where: { url: { startsWith: '/api/serve-image' } },
      take: 5
    });
    
    for (const memory of workingSamples) {
      console.log(`  🔗 ${memory.url}`);
    }

    // Check environment
    console.log(`\n🔧 Environment Check:`);
    console.log(`  🪣 S3_BUCKET: ${process.env.S3_BUCKET}`);
    console.log(`  🔗 S3_ENDPOINT: ${process.env.S3_ENDPOINT}`);
    console.log(`  🌍 S3_REGION: ${process.env.S3_REGION}`);

    console.log(`\n🎉 Final Status:`);
    if (working === apiUrls.length && failed === 0) {
      console.log(`  ✅ ALL PHOTOS WORKING!`);
      console.log(`  🚀 Application ready for use`);
      console.log(`  📸 All ${working} photos loading correctly`);
    } else if (working > 0) {
      console.log(`  ⚠️  Partial success: ${working}/${apiUrls.length} working`);
      console.log(`  🔧 Some photos may need attention`);
    } else {
      console.log(`  ❌ No photos working - need investigation`);
    }

  } catch (error) {
    console.error('❌ Final check failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

finalPhotoCheck().catch(console.error);
