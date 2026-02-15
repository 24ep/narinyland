import { PrismaClient } from '@prisma/client';

// Revert URLs back to Supabase for file migration
async function revertUrls() {
  console.log('🔄 Reverting URLs back to Supabase for file migration...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get memories with t3.storageapi.dev URLs
    const memories = await prisma.memory.findMany({
      where: { url: { contains: 't3.storageapi.dev' } }
    });
    
    console.log(`📸 Found ${memories.length} memories to revert`);

    let reverted = 0;
    for (const memory of memories) {
      try {
        // Extract the original Supabase path
        const urlParts = new URL(memory.url);
        const path = urlParts.pathname.replace('/convenient-crate-fpoysecg/', '');
        
        // Create original Supabase URL
        const originalUrl = `https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/${path}`;
        
        // Update database
        await prisma.memory.update({
          where: { id: memory.id },
          data: { url: originalUrl }
        });
        
        reverted++;
        console.log(`  ✅ Reverted: ${originalUrl}`);
        
      } catch (error) {
        console.log(`  ❌ Failed to revert memory ${memory.id}: ${error.message}`);
      }
    }

    // Revert timeline events too
    const timelineEvents = await prisma.timelineEvent.findMany({
      where: {
        OR: [
          { mediaUrl: { contains: 't3.storageapi.dev' } },
          { mediaUrls: { has: 't3.storageapi.dev' } }
        ]
      }
    });
    
    console.log(`\n📅 Found ${timelineEvents.length} timeline events to revert`);

    for (const event of timelineEvents) {
      try {
        const updateData = {};
        
        // Revert single media URL
        if (event.mediaUrl && event.mediaUrl.includes('t3.storageapi.dev')) {
          const urlParts = new URL(event.mediaUrl);
          const path = urlParts.pathname.replace('/convenient-crate-fpoysecg/', '');
          updateData.mediaUrl = `https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/${path}`;
        }
        
        // Revert media URLs array
        if (event.mediaUrls && event.mediaUrls.some(url => url.includes('t3.storageapi.dev'))) {
          updateData.mediaUrls = event.mediaUrls.map(url => {
            if (url.includes('t3.storageapi.dev')) {
              const urlParts = new URL(url);
              const path = urlParts.pathname.replace('/convenient-crate-fpoysecg/', '');
              return `https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/${path}`;
            }
            return url;
          });
        }
        
        if (Object.keys(updateData).length > 0) {
          await prisma.timelineEvent.update({
            where: { id: event.id },
            data: updateData
          });
          
          reverted++;
          console.log(`  ✅ Reverted timeline event ${event.id}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Failed to revert timeline event ${event.id}: ${error.message}`);
      }
    }

    console.log(`\n📊 Revert Summary:`);
    console.log(`  ✅ Successfully reverted: ${reverted} records`);
    console.log(`🔄 All URLs now point back to Supabase for file migration`);

  } catch (error) {
    console.error('❌ URL revert failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

revertUrls().catch(console.error);
