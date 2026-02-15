import { PrismaClient } from '@prisma/client';

// Alternative approach: Use online placeholder images
async function onlinePlaceholders() {
  console.log('🔄 Alternative: Online Placeholder Images...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get memories with placeholder images (the ones we just restored)
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          startsWith: '/api/serve-image?key=gallery/restored-',
          not: null,
          not: ''
        } 
      }
    });
    
    console.log(`📸 Found ${memories.length} placeholder photos to replace`);

    let updated = 0;
    let failed = 0;

    for (const memory of memories) {
      try {
        console.log(`\n🖼️  Updating: ${memory.url}`);
        
        // Use online placeholder service with different seeds for variety
        const seed = Math.random().toString(36).substring(2, 8);
        const width = 800;
        const height = 600;
        
        // Option 1: Placeholder.com
        const placeholderUrl = `https://via.placeholder.com/${width}x${height}/4a5568/ffffff?text=Narinyland+${seed}`;
        
        // Option 2: Picsum (random photos)
        // const placeholderUrl = `https://picsum.photos/seed/${seed}/${width}/${height}.jpg`;
        
        // Option 3: Lorem Picsum
        // const placeholderUrl = `https://loremflickr.com/${width}/${height}/nature,landscape`;
        
        // Update database with online placeholder URL
        await prisma.memory.update({
          where: { id: memory.id },
          data: { url: placeholderUrl }
        });
        
        updated++;
        console.log(`  ✅ Updated to: ${placeholderUrl}`);
        
      } catch (error) {
        console.log(`  ❌ Update failed: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`  ✅ Successfully updated: ${updated} photos`);
    console.log(`  ❌ Failed: ${failed} photos`);
    console.log(`  📦 Total processed: ${memories.length} photos`);

    // Verify final state
    const [localPhotos, onlinePhotos, supabasePhotos] = await Promise.all([
      prisma.memory.count({ where: { url: { startsWith: '/api/serve-image' } } }),
      prisma.memory.count({ where: { url: { startsWith: 'https://via.placeholder.com' } } }),
      prisma.memory.count({ where: { url: { contains: 'supabase' } } })
    ]);
    
    console.log(`\n🎯 Final State:`);
    console.log(`  🟢 Local photos: ${localPhotos}`);
    console.log(`  🌐 Online placeholders: ${onlinePhotos}`);
    console.log(`  🔵 Supabase: ${supabasePhotos}`);
    console.log(`  📦 Total: ${localPhotos + onlinePhotos + supabasePhotos}`);

    if (updated > 0) {
      console.log('\n🎉 Online Placeholders Complete!');
      console.log('✅ All placeholder photos replaced with online images');
      console.log('🚀 Application now displays varied placeholder images');
      console.log('📝 Can be replaced with real photos later');
    }

  } catch (error) {
    console.error('❌ Online placeholders failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

onlinePlaceholders().catch(console.error);
