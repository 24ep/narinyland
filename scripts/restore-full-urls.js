import { PrismaClient } from '@prisma/client';

// Restore full URLs from the original migration data
async function restoreFullUrls() {
  console.log('🔄 Restoring full original URLs...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Original full URLs from the migration
    const originalUrls = [
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/076958f3-f7cc-4581-a176-0db77e3942c0.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/1640909c-4cbb-45aa-b36a-09e3316ad967.JPG',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/42505efb-7a80-43af-ad6d-14447b882f8a.JPG',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/7164d66e-0924-46d8-bde7-6492761579f5.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/4e3887a2-a7ad-4079-bc4d-3d5ff9e8659a.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/9fc182f3-a0df-4c9c-8c0c-214d8b6c5ee8.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/c0780028-66cb-4c59-be47-0c0006f7b11c.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/cdabb774-7bdf-4d00-88d0-43d43572aaea.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/d0398ea1-b329-42cf-9bb1-1d129edce3d9.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/d0a2324f-0bbd-4301-98f1-a34323207daf.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/ecb2a3f2-d333-4985-8454-9f9afd04762c.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/f31f7c35-7b51-43df-86a5-18c1529f9d2d.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/f725674c-37e4-4e6b-b148-5afb1525b50e.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/fc1891d2-ae1e-4623-af9a-5523cd107a30.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/583a1f13-37a8-4596-aaa0-7596b50a4bb4.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/6fc8de69-4bec-4fa2-a95d-3c12fa99d858.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/75ad7d16-12e9-43d2-8960-831424bd728d.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/ba33e115-b747-4cf7-a98f-11dc5473b630.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/af4e04f9-78cf-491b-9561-5dc3549cff78.png'
    ];

    // Get all memories
    const memories = await prisma.memory.findMany({
      where: { url: { not: null, not: '' } }
    });
    
    console.log(`📸 Found ${memories.length} memories to update`);
    
    let updated = 0;
    for (let i = 0; i < Math.min(memories.length, originalUrls.length); i++) {
      try {
        await prisma.memory.update({
          where: { id: memories[i].id },
          data: { url: originalUrls[i] }
        });
        
        updated++;
        console.log(`  ✅ Updated: ${originalUrls[i].substring(0, 80)}...`);
        
      } catch (error) {
        console.log(`  ❌ Failed to update memory ${memories[i].id}: ${error.message}`);
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`  ✅ Successfully updated: ${updated} URLs`);
    console.log(`🔄 Full URLs restored for S3 migration`);

  } catch (error) {
    console.error('❌ URL restore failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreFullUrls().catch(console.error);
