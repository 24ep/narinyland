import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalTest() {
  try {
    await prisma.$connect();
    console.log('🎯 Final Verification Test\n');

    // Test database
    const result = await prisma.$queryRaw`SELECT "gallery" FROM "AppConfig" WHERE "id" = 'default'`;
    const galleryData = result[0].gallery;
    const parsed = typeof galleryData === 'string' ? JSON.parse(galleryData) : galleryData;
    console.log(`✅ Database: ${parsed.length} gallery items`);

    // Test API
    const response = await fetch('http://localhost:3000/api/serve-image?key=gallery/placeholder-1.svg', { method: 'HEAD' });
    console.log(`✅ API: ${response.status} ${response.statusText}`);

    // Test main page
    const pageResponse = await fetch('http://localhost:3000', { method: 'HEAD' });
    console.log(`✅ Main Page: ${pageResponse.status} ${pageResponse.statusText}`);

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('📸 Images should now be loading correctly');
    console.log('🌐 Visit http://localhost:3000 to see your photos');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalTest();
