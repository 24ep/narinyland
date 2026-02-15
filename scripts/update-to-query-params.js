import { PrismaClient } from '@prisma/client';

// Update database URLs to use query parameter format
async function updateToQueryParams() {
  console.log('🔄 Updating database URLs to use query parameter format...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all memories with proxy URLs
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          startsWith: '/api/photos/',
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
        const key = memory.url.replace('/api/photos/', '');
        
        // Create new query parameter URL
        const newUrl = `/api/serve-image?key=${key}`;
        
        // Update database
        await prisma.memory.update({
          where: { id: memory.id },
          data: { url: newUrl }
        });
        
        updated++;
        console.log(`  ✅ Updated: ${key} -> ${newUrl}`);
        
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
          startsWith: '/api/serve-image',
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
      console.log('\n🎉 Query Parameter URLs Update Complete!');
      console.log('✅ All photos now use query parameter URLs');
      console.log('🚀 Photos will load correctly through /api/serve-image?key=...');
      console.log('📸 Photos served via: /api/serve-image endpoint');
    }

  } catch (error) {
    console.error('❌ Query parameter URL update failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateToQueryParams().catch(console.error);
