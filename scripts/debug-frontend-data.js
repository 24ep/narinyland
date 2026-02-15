import { PrismaClient } from '@prisma/client';

// Debug what data the frontend is actually receiving
async function debugFrontendData() {
  console.log('🔍 Debugging frontend data source...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check what data the frontend components are using
    console.log('🔍 Checking AppConfig (frontend configuration):');
    
    const appConfigs = await prisma.appConfig.findMany({
      take: 3
    });
    
    console.log(`📱 Found ${appConfigs.length} app configs:`);
    
    for (const config of appConfigs) {
      console.log(`\n  📱 Config ID: ${config.id}`);
      console.log(`  📸 Gallery items: ${config.gallery ? config.gallery.length : 0}`);
      
      if (config.gallery && config.gallery.length > 0) {
        console.log('  📸 Sample gallery URLs:');
        config.gallery.slice(0, 3).forEach((item, index) => {
          console.log(`    ${index + 1}. ${item.url}`);
          
          // Test if this URL works
          if (item.url && item.url.startsWith('/api/')) {
            const fullUrl = `http://localhost:3000${item.url}`;
            try {
              const response = await fetch(fullUrl, { method: 'HEAD' });
              console.log(`       ✅ ${response.status} ${response.statusText}`);
            } catch (error) {
              console.log(`       ❌ Error: ${error.message}`);
            }
          }
        });
      }
    }

    // Check if there are any timeline events with media
    console.log('\n📅 Checking Timeline Events:');
    
    const timelineEvents = await prisma.timelineEvent.findMany({
      where: {
        mediaUrl: {
          not: null,
          not: ''
        }
      },
      take: 5
    });
    
    console.log(`📅 Found ${timelineEvents.length} timeline events with media:`);
    
    for (const event of timelineEvents) {
      console.log(`  📅 Event ID: ${event.id}`);
      console.log(`  🎬 Media URL: ${event.mediaUrl}`);
      console.log(`  🎭 Media Type: ${event.mediaType}`);
      
      if (event.mediaUrl && event.mediaUrl.startsWith('/api/')) {
        const fullUrl = `http://localhost:3000${event.mediaUrl}`;
        try {
          const response = await fetch(fullUrl, { method: 'HEAD' });
          console.log(`     ✅ ${response.status} ${response.statusText}`);
        } catch (error) {
          console.log(`     ❌ Error: ${error.message}`);
        }
      }
    }

    // Check if there are any love letters with media
    console.log('\n💝 Checking Love Letters:');
    
    const loveLetters = await prisma.loveLetter.findMany({
      where: {
        mediaUrl: {
          not: null,
          not: ''
        }
      },
      take: 3
    });
    
    console.log(`💝 Found ${loveLetters.length} love letters with media:`);
    
    for (const letter of loveLetters) {
      console.log(`  💝 Letter ID: ${letter.id}`);
      console.log(`  🎬 Media URL: ${letter.mediaUrl}`);
      
      if (letter.mediaUrl && letter.mediaUrl.startsWith('/api/')) {
        const fullUrl = `http://localhost:3000${letter.mediaUrl}`;
        try {
          const response = await fetch(fullUrl, { method: 'HEAD' });
          console.log(`     ✅ ${response.status} ${response.statusText}`);
        } catch (error) {
          console.log(`     ❌ Error: ${error.message}`);
        }
      }
    }

    console.log('\n🎯 Frontend Data Analysis:');
    console.log('  - Check which component is displaying images');
    console.log('  - Verify the data source (AppConfig.gallery vs Memory vs Timeline)');
    console.log('  - Ensure the frontend is using the updated getDisplayUrl function');
    console.log('  - Check browser dev tools for actual requests being made');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

debugFrontendData().catch(console.error);
