import { PrismaClient } from '@prisma/client';

// Verify photo status and test loading
async function verifyPhotoStatus() {
  console.log('🔍 Verifying photo status...\n');

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
      },
      take: 10
    });
    
    console.log(`📸 Checking ${memories.length} photo URLs:`);
    
    let working = 0;
    let failed = 0;
    
    for (const memory of memories) {
      try {
        console.log(`\n🧪 Testing: ${memory.url.substring(0, 80)}...`);
        
        const response = await fetch(memory.url, { method: 'HEAD' });
        
        if (response.ok) {
          working++;
          console.log(`  ✅ Status: ${response.status} ${response.statusText}`);
          console.log(`  📊 Content-Type: ${response.headers.get('content-type')}`);
          console.log(`  📏 Content-Length: ${response.headers.get('content-length')} bytes`);
        } else {
          failed++;
          console.log(`  ❌ Status: ${response.status} ${response.statusText}`);
        }
        
      } catch (error) {
        failed++;
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    // Count total photos by provider
    const [t3Count, supabaseCount, otherCount] = await Promise.all([
      prisma.memory.count({ where: { url: { contains: 't3.storageapi.dev' } } }),
      prisma.memory.count({ where: { url: { contains: 'supabase' } } }),
      prisma.memory.count({ where: { 
        url: { 
          not: null,
          not: '',
          AND: [
            { not: { contains: 't3.storageapi.dev' } },
            { not: { contains: 'supabase' } }
          ]
        } 
      }})
    ]);

    console.log(`\n📊 Photo Distribution:`);
    console.log(`  🟢 t3.storageapi.dev: ${t3Count} photos`);
    console.log(`  🔵 Supabase: ${supabaseCount} photos`);
    console.log(`  ⚪ Other: ${otherCount} photos`);
    console.log(`  📦 Total: ${t3Count + supabaseCount + otherCount} photos`);

    console.log(`\n🧪 Test Results:`);
    console.log(`  ✅ Working URLs: ${working}`);
    console.log(`  ❌ Failed URLs: ${failed}`);
    console.log(`  📊 Success Rate: ${Math.round((working / memories.length) * 100)}%`);

    // Check environment variables
    console.log(`\n🔧 Current S3 Configuration:`);
    console.log(`  🪣 Bucket: ${process.env.S3_BUCKET}`);
    console.log(`  🔗 Endpoint: ${process.env.S3_ENDPOINT}`);
    console.log(`  🌍 Region: ${process.env.S3_REGION}`);

    if (working === memories.length && t3Count > 0) {
      console.log('\n🎉 All photos are working correctly!');
      console.log('✅ Migration to new bucket successful');
    } else if (failed > 0) {
      console.log('\n⚠️  Some photos are not loading');
      console.log('📝 May need additional fixes');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyPhotoStatus().catch(console.error);
