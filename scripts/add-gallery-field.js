import { PrismaClient } from '@prisma/client';

// Add gallery field to AppConfig manually
async function addGalleryField() {
  console.log('🔧 Adding gallery field to AppConfig...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all memories
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          not: null,
          not: ''
        } 
      }
    });
    
    console.log(`📸 Found ${memories.length} memories`);

    // Convert memories to gallery format
    const galleryItems = memories.map(memory => ({
      url: memory.url,
      privacy: memory.privacy || 'public',
      caption: memory.caption || ''
    }));

    console.log(`🔄 Converting ${memories.length} memories to gallery format`);

    // Update AppConfig with the gallery data using raw SQL
    const galleryJsonString = JSON.stringify(galleryItems);
    
    const result = await prisma.$executeRaw`
      UPDATE "AppConfig" 
      SET "gallery" = $1, "updatedAt" = NOW() 
      WHERE "id" = 'default'
    `, [galleryJsonString];

    console.log(`✅ Updated AppConfig.gallery with ${galleryItems.length} items`);

    // Verify the update
    const updatedConfig = await prisma.$queryRaw`
      SELECT "gallery" FROM "AppConfig" WHERE "id" = 'default'
    `;

    if (updatedConfig.length > 0) {
      const galleryData = JSON.parse(updatedConfig[0].gallery);
      console.log(`📊 Verification: AppConfig.gallery now has ${galleryData.length} items`);
      
      // Show sample items
      console.log('\n📸 Sample gallery items:');
      galleryData.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.url} (${item.privacy})`);
      });
    }

    console.log('\n🎉 Gallery field added successfully!');
    console.log('💡 The frontend should now display images correctly');

  } catch (error) {
    console.error('❌ Failed to add gallery field:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addGalleryField().catch(console.error);
