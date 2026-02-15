import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalFix() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check if gallery column exists
    const checkResult = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'AppConfig' AND column_name = 'gallery'
    `;
    
    if (checkResult.length === 0) {
      console.log('📝 Adding gallery column...');
      await prisma.$executeRaw`ALTER TABLE "AppConfig" ADD COLUMN "gallery" JSONB DEFAULT '[]'`);
      console.log('✅ Gallery column added');
    } else {
      console.log('✅ Gallery column already exists');
    }

    // Get memories
    const memories = await prisma.memory.findMany({
      where: { url: { not: null, not: '' } }
    });
    
    console.log(`📸 Found ${memories.length} memories`);

    // Create gallery data
    const galleryData = memories.map(m => ({
      url: m.url,
      privacy: m.privacy || 'public',
      caption: m.caption || ''
    }));

    const jsonString = JSON.stringify(galleryData);
    console.log(`🔄 Created JSON with ${galleryData.length} items`);

    // Update AppConfig
    await prisma.$executeRaw`UPDATE "AppConfig" SET "gallery" = $1, "updatedAt" = NOW() WHERE "id" = 'default'`, [jsonString]);
    console.log('✅ Updated AppConfig');

    // Verify
    const result = await prisma.$queryRaw`SELECT "gallery" FROM "AppConfig" WHERE "id" = 'default'`;
    const parsed = JSON.parse(result[0].gallery);
    console.log(`📊 Verification: ${parsed.length} items in gallery`);
    console.log('🎉 Fix complete! Images should now load.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalFix();
