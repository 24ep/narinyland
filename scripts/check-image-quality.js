import { PrismaClient } from '@prisma/client';

// Check image quality and migration status
async function checkImageQuality() {
  console.log('🔍 Checking image quality and migration status...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get current gallery data
    const result = await prisma.$queryRaw`SELECT "gallery" FROM "AppConfig" WHERE "id" = 'default'`;
    const galleryData = result[0].gallery;
    const gallery = typeof galleryData === 'string' ? JSON.parse(galleryData) : galleryData;
    
    console.log(`📸 Total gallery items: ${gallery.length}`);

    // Test a few images to see their quality
    console.log('\n🧪 Testing image quality:');
    
    for (let i = 0; i < Math.min(5, gallery.length); i++) {
      const item = gallery[i];
      const displayUrl = `http://localhost:3000${item.url}`;
      
      console.log(`\n  📸 Item ${i + 1}: ${item.url}`);
      
      try {
        const response = await fetch(displayUrl, { method: 'HEAD' });
        const size = response.headers.get('content-length');
        const type = response.headers.get('content-type');
        
        console.log(`    📏 Size: ${size} bytes`);
        console.log(`    🎨 Type: ${type}`);
        console.log(`    📊 Status: ${response.status} ${response.statusText}`);
        
        // Check if it's a placeholder
        if (item.url.includes('placeholder-')) {
          console.log(`    🔄 Type: Placeholder image`);
        } else {
          console.log(`    🖼️  Type: Original image`);
        }
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
      }
    }

    // Count placeholders vs originals
    const placeholders = gallery.filter(item => item.url.includes('placeholder-')).length;
    const originals = gallery.length - placeholders;
    
    console.log(`\n📊 Image Distribution:`);
    console.log(`  🖼️  Original images: ${originals}`);
    console.log(`  🔄 Placeholder images: ${placeholders}`);
    console.log(`  📦 Total: ${gallery.length}`);

    console.log('\n💡 Migration Options:');
    console.log('  1. Keep current setup (mixed originals + placeholders)');
    console.log('  2. Remigrate all images from original sources');
    console.log('  3. Replace placeholders with better quality images');

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImageQuality();
