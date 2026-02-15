import { PrismaClient } from '@prisma/client';

// Update S3 URLs from Supabase to t3.storageapi.dev
async function updateS3Urls() {
  console.log('🔄 Updating S3 URLs from Supabase to t3.storageapi.dev...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all memories with Supabase URLs
    const memories = await prisma.memory.findMany({
      where: {
        url: {
          contains: 'supabase'
        }
      }
    });
    
    console.log(`📸 Found ${memories.length} memories with Supabase URLs to update`);

    // Update each memory URL
    let updated = 0;
    for (const memory of memories) {
      try {
        // Extract S3 key from Supabase URL
        const urlParts = new URL(memory.url);
        const s3Key = urlParts.pathname.slice(1); // Remove leading slash
        
        // Create new t3.storageapi.dev URL
        const newUrl = `https://t3.storageapi.dev/convenient-crate-fpoysecg/${s3Key}`;
        
        // Update database
        await prisma.memory.update({
          where: { id: memory.id },
          data: { url: newUrl }
        });
        
        updated++;
        console.log(`  ✅ Updated: ${memory.url} -> ${newUrl}`);
        
      } catch (error) {
        console.log(`  ❌ Failed to update memory ${memory.id}: ${error.message}`);
      }
    }

    // Update timeline events too
    const timelineEvents = await prisma.timelineEvent.findMany({
      where: {
        OR: [
          { mediaUrl: { contains: 'supabase' } },
          { mediaUrls: { has: 'supabase' } }
        ]
      }
    });
    
    console.log(`\n📅 Found ${timelineEvents.length} timeline events with Supabase URLs to update`);

    for (const event of timelineEvents) {
      try {
        const updateData = {};
        
        // Update single media URL
        if (event.mediaUrl && event.mediaUrl.includes('supabase')) {
          const urlParts = new URL(event.mediaUrl);
          const s3Key = urlParts.pathname.slice(1);
          updateData.mediaUrl = `https://t3.storageapi.dev/convenient-crate-fpoysecg/${s3Key}`;
        }
        
        // Update media URLs array
        if (event.mediaUrls && event.mediaUrls.some(url => url.includes('supabase'))) {
          updateData.mediaUrls = event.mediaUrls.map(url => {
            if (url.includes('supabase')) {
              const urlParts = new URL(url);
              const s3Key = urlParts.pathname.slice(1);
              return `https://t3.storageapi.dev/convenient-crate-fpoysecg/${s3Key}`;
            }
            return url;
          });
        }
        
        if (Object.keys(updateData).length > 0) {
          await prisma.timelineEvent.update({
            where: { id: event.id },
            data: updateData
          });
          
          updated++;
          console.log(`  ✅ Updated timeline event ${event.id}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Failed to update timeline event ${event.id}: ${error.message}`);
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`  ✅ Successfully updated: ${updated} records`);
    console.log(`🚀 All S3 URLs now point to t3.storageapi.dev!`);
    console.log(`🔗 Bucket: convenient-crate-fpoysecg`);

  } catch (error) {
    console.error('❌ S3 URL update failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateS3Urls().catch(console.error);
