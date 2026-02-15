import { PrismaClient } from '@prisma/client';

// Fix database schema by adding gallery field
async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check if gallery column exists
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'AppConfig' 
      AND column_name = 'gallery'
    `;
    
    if (tableInfo.length > 0) {
      console.log('✅ Gallery column already exists');
    } else {
      console.log('📝 Adding gallery column to AppConfig table...');
      
      // Add gallery column
      await prisma.$executeRaw`
        ALTER TABLE "AppConfig" 
        ADD COLUMN "gallery" JSONB DEFAULT '[]'
      `;
      
      console.log('✅ Gallery column added');
    }

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

    // Convert to gallery format
    const galleryData = memories.map(memory => ({
      url: memory.url,
      privacy: memory.privacy || 'public',
      caption: memory.caption || ''
    }));

    const galleryJson = JSON.stringify(galleryData);
    console.log(`🔄 Created gallery JSON with ${galleryData.length} items`);

    // Update AppConfig with gallery data
    await prisma.$executeRaw`
      UPDATE "AppConfig" 
      SET "gallery" = $1, "updatedAt" = NOW() 
      WHERE "id" = 'default'
    `, [galleryJson]);

    console.log('✅ Updated AppConfig with gallery data');

    // Verify
    const result = await prisma.$queryRaw`
      SELECT "gallery" FROM "AppConfig" WHERE "id" = 'default'
    `;

    if (result.length > 0) {
      const parsed = JSON.parse(result[0].gallery);
      console.log(`📊 Verification: ${parsed.length} items in gallery`);
      
      // Show sample
      console.log('\n📸 Sample gallery items:');
      parsed.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.url}`);
      });
      
      console.log('\n🎉 Database schema fix complete!');
      console.log('💡 Images should now load correctly in the browser');
    }

  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabaseSchema().catch(console.error);
