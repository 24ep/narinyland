import { PrismaClient } from '@prisma/client';

// Simple debug of frontend data
async function simpleFrontendDebug() {
  console.log('🔍 Simple frontend data debug...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check AppConfig (main frontend data source)
    console.log('📱 Checking AppConfig:');
    
    const appConfigs = await prisma.appConfig.findMany({
      take: 1
    });
    
    if (appConfigs.length > 0) {
      const config = appConfigs[0];
      console.log(`  📱 Config ID: ${config.id}`);
      console.log(`  📸 Gallery items: ${config.gallery ? config.gallery.length : 0}`);
      
      if (config.gallery && config.gallery.length > 0) {
        console.log('  📸 First 3 gallery URLs:');
        config.gallery.slice(0, 3).forEach((item, index) => {
          console.log(`    ${index + 1}. ${item.url}`);
        });
      }
    }

    // Check Memory table (alternative data source)
    console.log('\n📸 Checking Memory table:');
    
    const memories = await prisma.memory.findMany({
      take: 3
    });
    
    console.log(`  📸 Memory items: ${memories.length}`);
    
    memories.forEach((memory, index) => {
      console.log(`    ${index + 1}. ${memory.url}`);
    });

    console.log('\n💡 Debug Info:');
    console.log('  - Frontend likely uses AppConfig.gallery for images');
    console.log('  - MemoryFrame component might use Memory table');
    console.log('  - Check which component is actually displaying images');
    console.log('  - Verify browser dev tools Network tab for failed requests');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

simpleFrontendDebug().catch(console.error);
