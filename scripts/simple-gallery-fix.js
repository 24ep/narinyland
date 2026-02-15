import { PrismaClient } from '@prisma/client';

// Simple gallery fix
async function simpleGalleryFix() {
  console.log('🔧 Simple gallery fix...\n');

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

    const jsonString = JSON.stringify(galleryItems);
    console.log(`🔄 Created JSON with ${galleryItems.length} items`);

    // Update AppConfig using raw SQL
    await prisma.$executeRaw`
      UPDATE "AppConfig" 
      SET "gallery" = $1, "updatedAt" = NOW() 
      WHERE "id" = 'default'
    `, [jsonString]);

    console.log(`✅ Updated AppConfig.gallery`);

    // Verify
    const result = await prisma.$queryRaw`
      SELECT "gallery" FROM "AppConfig" WHERE "id" = 'default'
    `;

    if (result.length > 0) {
      const parsed = JSON.parse(result[0].gallery);
      console.log(`📊 Verification: ${parsed.length} items in gallery`);
      console.log('🎉 Gallery fix complete!');
    }

  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

simpleGalleryFix().catch(console.error);
