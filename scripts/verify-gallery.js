import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyGallery() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check gallery directly with raw SQL
    const result = await prisma.$queryRaw`SELECT "gallery" FROM "AppConfig" WHERE "id" = 'default'`;
    
    if (result.length > 0) {
      const galleryValue = result[0].gallery;
      console.log('📊 Raw gallery value type:', typeof galleryValue);
      console.log('📊 Raw gallery value:', galleryValue);
      
      if (galleryValue) {
        const parsed = typeof galleryValue === 'string' ? JSON.parse(galleryValue) : galleryValue;
        console.log(`📸 Gallery items: ${parsed.length}`);
        
        if (parsed.length > 0) {
          console.log('🎉 SUCCESS: Gallery has data!');
          console.log('📸 Sample items:');
          parsed.slice(0, 3).forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.url}`);
          });
        }
      } else {
        console.log('❌ Gallery is empty');
      }
    } else {
      console.log('❌ No AppConfig found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyGallery();
