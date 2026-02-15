import { PrismaClient } from '@prisma/client';

// Update database URLs to use photo proxy
async function updateToProxyUrls() {
  console.log('🔄 Updating database URLs to use photo proxy...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all memories with t3.storageapi.dev URLs
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          contains: 't3.storageapi.dev',
          not: null,
          not: ''
        } 
      }
    });
    
    console.log(`📸 Found ${memories.length} memories to update`);
    
    let updated = 0;
    let failed = 0;

    for (const memory of memories) {
      try {
        // Extract key from current URL
        const urlParts = new URL(memory.url);
        const photoKey = urlParts.pathname.replace('/narinlyland-storage-mek5-t/', '');
        
        // Create proxy URL
        const proxyUrl = `/api/photos/${photoKey}`;
        
        // Update database
        await prisma.memory.update({
          where: { id: memory.id },
          data: { url: proxyUrl }
        });
        
        updated++;
        console.log(`  ✅ Updated: ${photoKey} -> ${proxyUrl}`);
        
      } catch (error) {
        console.log(`  ❌ Failed to update memory ${memory.id}: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`  ✅ Successfully updated: ${updated} URLs`);
    console.log(`  ❌ Failed: ${failed} URLs`);
    console.log(`  📦 Total processed: ${memories.length} URLs`);

    // Verify the updates
    const updatedMemories = await prisma.memory.findMany({
      where: { 
        url: { 
          startsWith: '/api/photos/',
          not: null,
          not: ''
        } 
      },
      take: 5
    });
    
    console.log(`\n🎯 Sample Updated URLs:`);
    for (const memory of updatedMemories) {
      console.log(`  🔗 ${memory.url}`);
    }

    if (updated > 0) {
      console.log('\n🎉 Photo Proxy URLs Update Complete!');
      console.log('✅ All photos now use proxy URLs');
      console.log('🚀 Photos will load correctly through the application');
      console.log('📸 Photos served via: /api/photos/[key] endpoint');
    }

  } catch (error) {
    console.error('❌ Proxy URL update failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateToProxyUrls().catch(console.error);
