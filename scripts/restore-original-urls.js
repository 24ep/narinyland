import { PrismaClient } from '@prisma/client';

// Restore original Supabase URLs
async function restoreOriginalUrls() {
  console.log('🔄 Restoring original Supabase URLs...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all memories with placeholder URLs
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          contains: 'via.placeholder.com'
        } 
      }
    });
    
    console.log(`📸 Found ${memories.length} memories to restore`);

    let restored = 0;
    for (const memory of memories) {
      try {
        // Extract filename from placeholder URL
        const urlParts = new URL(memory.url);
        const filename = urlParts.searchParams.get('text');
        
        if (filename) {
          // Create original Supabase URL
          const originalUrl = `https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/${filename}.jpg`;
          
          // Update database
          await prisma.memory.update({
            where: { id: memory.id },
            data: { url: originalUrl }
          });
          
          restored++;
          console.log(`  ✅ Restored: ${originalUrl}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Failed to restore memory ${memory.id}: ${error.message}`);
      }
    }

    console.log(`\n📊 Restore Summary:`);
    console.log(`  ✅ Successfully restored: ${restored} photos`);
    console.log(`🚀 Photos should now load from Supabase`);

  } catch (error) {
    console.error('❌ URL restore failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreOriginalUrls().catch(console.error);
