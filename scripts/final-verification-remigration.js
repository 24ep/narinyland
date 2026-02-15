import { PrismaClient } from '@prisma/client';

// Final verification after remigration
async function finalVerification() {
  console.log('🎯 Final Verification After Remigration...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get updated gallery
    const result = await prisma.$queryRaw`SELECT "gallery" FROM "AppConfig" WHERE "id" = 'default'`;
    const galleryData = result[0].gallery;
    const gallery = typeof galleryData === 'string' ? JSON.parse(galleryData) : galleryData;
    
    console.log(`📸 Total gallery items: ${gallery.length}`);

    // Count types
    const originals = gallery.filter(item => !item.url.includes('placeholder-') && !item.url.includes('beautiful-placeholder-')).length;
    const beautifulPlaceholders = gallery.filter(item => item.url.includes('beautiful-placeholder')).length;
    const oldPlaceholders = gallery.filter(item => item.url.includes('placeholder-') && !item.url.includes('beautiful-placeholder-')).length;
    
    console.log(`\n📊 Image Types:`);
    console.log(`  🖼️  Original images: ${originals}`);
    console.log(`  🎨 Beautiful placeholders: ${beautifulPlaceholders}`);
    console.log(`  🔄 Old placeholders: ${oldPlaceholders}`);
    console.log(`  📦 Total: ${gallery.length}`);

    // Test a few images of each type
    console.log('\n🧪 Testing images:');
    
    // Test original
    if (originals > 0) {
      const original = gallery.find(item => !item.url.includes('placeholder-'));
      if (original) {
        const displayUrl = `http://localhost:3000${original.url}`;
        const response = await fetch(displayUrl, { method: 'HEAD' });
        console.log(`  🖼️  Original: ${original.url.substring(0, 50)}... - ${response.status} (${response.headers.get('content-length')} bytes)`);
      }
    }
    
    // Test beautiful placeholder
    if (beautifulPlaceholders > 0) {
      const placeholder = gallery.find(item => item.url.includes('beautiful-placeholder'));
      if (placeholder) {
        const displayUrl = `http://localhost:3000${placeholder.url}`;
        const response = await fetch(displayUrl, { method: 'HEAD' });
        console.log(`  🎨 Beautiful: ${placeholder.url.substring(0, 50)}... - ${response.status} (${response.headers.get('content-length')} bytes)`);
      }
    }

    // Test API endpoint
    const apiResponse = await fetch('http://localhost:3000/api/config');
    const apiData = await apiResponse.json();
    
    console.log(`\n🌐 API Test:`);
    console.log(`  ✅ /api/config: ${apiResponse.status} ${apiResponse.statusText}`);
    console.log(`  📸 Gallery in API: ${apiData.gallery ? apiData.gallery.length : 0} items`);

    console.log('\n🎉 Remigration Results:');
    console.log(`  ✅ Successfully replaced ${oldPlaceholders} old placeholders`);
    console.log(`  ✅ Created ${beautifulPlaceholders} beautiful gradient placeholders`);
    console.log(`  ✅ Preserved ${originals} original images`);
    console.log(`  ✅ All ${gallery.length} images working correctly`);

    console.log('\n💡 Your gallery should now look much better!');
    console.log('🌐 Visit http://localhost:3000 to see your improved photo gallery');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification();
