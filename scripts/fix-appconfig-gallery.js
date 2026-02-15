import { PrismaClient } from '@prisma/client';

// Fix the AppConfig.gallery by copying memories to it
async function fixAppConfigGallery() {
  console.log('🔧 Fixing AppConfig.gallery with memories data...\n');

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

    // Get the current AppConfig
    const appConfig = await prisma.appConfig.findFirst({
      where: { id: 'default' }
    });
    
    if (!appConfig) {
      console.log('❌ No AppConfig found');
      return;
    }

    console.log(`📱 Current AppConfig.gallery has ${appConfig.gallery ? appConfig.gallery.length : 0} items`);

    // Convert memories to gallery format
    const galleryItems = memories.map(memory => ({
      url: memory.url,
      privacy: memory.privacy || 'public',
      caption: memory.caption || ''
    }));

    console.log(`🔄 Converting ${memories.length} memories to gallery format`);

    // Update AppConfig with the gallery data
    const updatedConfig = await prisma.appConfig.update({
      where: { id: 'default' },
      data: {
        gallery: galleryItems
      }
    });

    console.log(`✅ Updated AppConfig.gallery with ${galleryItems.length} items`);

    // Verify the update
    const verifiedConfig = await prisma.appConfig.findFirst({
      where: { id: 'default' }
    });

    console.log(`📊 Verification: AppConfig.gallery now has ${verifiedConfig.gallery ? verifiedConfig.gallery.length : 0} items`);

    // Show sample items
    if (verifiedConfig.gallery && verifiedConfig.gallery.length > 0) {
      console.log('\n📸 Sample gallery items:');
      verifiedConfig.gallery.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.url} (${item.privacy})`);
      });
    }

    console.log('\n🎉 AppConfig.gallery fix complete!');
    console.log('💡 The frontend should now display images correctly');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAppConfigGallery().catch(console.error);
