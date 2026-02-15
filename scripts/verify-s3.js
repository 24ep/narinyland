import { PrismaClient } from '@prisma/client';

async function verifyS3Migration() {
  console.log('🔍 Verifying S3 migration to t3.storageapi.dev...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check memories URLs
    const memories = await prisma.memory.findMany({ take: 5 });
    console.log(`📸 Checking ${memories.length} memory URLs:`);
    
    let memoryUrlsCorrect = 0;
    for (const memory of memories) {
      if (memory.url && memory.url.includes('t3.storageapi.dev')) {
        memoryUrlsCorrect++;
        console.log(`  ✅ ${memory.url.substring(0, 60)}...`);
      } else if (memory.url && memory.url.includes('supabase')) {
        console.log(`  ❌ Still pointing to Supabase: ${memory.url.substring(0, 60)}...`);
      } else {
        console.log(`  ℹ️  No URL or other: ${memory.url || 'NULL'}`);
      }
    }

    // Check timeline event URLs
    const timelineEvents = await prisma.timelineEvent.findMany({ take: 3 });
    console.log(`\n📅 Checking ${timelineEvents.length} timeline event URLs:`);
    
    let eventUrlsCorrect = 0;
    for (const event of timelineEvents) {
      if (event.mediaUrl && event.mediaUrl.includes('t3.storageapi.dev')) {
        eventUrlsCorrect++;
        console.log(`  ✅ ${event.mediaUrl.substring(0, 60)}...`);
      } else if (event.mediaUrl && event.mediaUrl.includes('supabase')) {
        console.log(`  ❌ Still pointing to Supabase: ${event.mediaUrl.substring(0, 60)}...`);
      }
      
      if (event.mediaUrls && event.mediaUrls.length > 0) {
        for (const url of event.mediaUrls) {
          if (url.includes('t3.storageapi.dev')) {
            eventUrlsCorrect++;
          } else if (url.includes('supabase')) {
            console.log(`  ❌ Array URL still Supabase: ${url.substring(0, 60)}...`);
          }
        }
      }
    }

    // Count total records with t3.storageapi.dev URLs
    const [totalMemories, totalEvents] = await Promise.all([
      prisma.memory.count({
        where: { url: { contains: 't3.storageapi.dev' } }
      }),
      prisma.timelineEvent.count({
        where: {
          OR: [
            { mediaUrl: { contains: 't3.storageapi.dev' } },
            { mediaUrls: { has: 't3.storageapi.dev' } }
          ]
        }
      })
    ]);

    // Count any remaining Supabase URLs
    const [remainingSupabaseMemories, remainingSupabaseEvents] = await Promise.all([
      prisma.memory.count({
        where: { url: { contains: 'supabase' } }
      }),
      prisma.timelineEvent.count({
        where: {
          OR: [
            { mediaUrl: { contains: 'supabase' } },
            { mediaUrls: { has: 'supabase' } }
          ]
        }
      })
    ]);

    console.log('\n📊 S3 Migration Summary:');
    console.log(`  ✅ Memories with t3.storageapi.dev URLs: ${totalMemories}`);
    console.log(`  ✅ Timeline Events with t3.storageapi.dev URLs: ${totalEvents}`);
    console.log(`  ❌ Remaining Supabase Memory URLs: ${remainingSupabaseMemories}`);
    console.log(`  ❌ Remaining Supabase Event URLs: ${remainingSupabaseEvents}`);
    console.log(`  📦 Total migrated URLs: ${totalMemories + totalEvents}`);

    // Check environment variables
    console.log('\n🔧 Environment Variables:');
    console.log(`  S3_ENDPOINT: ${process.env.S3_ENDPOINT}`);
    console.log(`  S3_BUCKET: ${process.env.S3_BUCKET}`);
    console.log(`  S3_REGION: ${process.env.S3_REGION}`);

    if (remainingSupabaseMemories === 0 && remainingSupabaseEvents === 0) {
      console.log('\n🎉 S3 Migration Verification Complete!');
      console.log('✅ All S3 URLs successfully migrated to t3.storageapi.dev!');
      console.log('🚀 Application is ready to use the new S3 provider!');
    } else {
      console.log('\n⚠️  S3 Migration Incomplete');
      console.log(`❌ Some URLs still pointing to Supabase`);
    }

  } catch (error) {
    console.error('❌ S3 verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyS3Migration().catch(console.error);
