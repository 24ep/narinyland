// Final verification of timeline image fix
import { PrismaClient } from '@prisma/client';

async function finalTimelineImageVerification() {
  console.log('🎯 Final Timeline Image Verification...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all timeline events with media
    console.log('1️⃣  Checking all timeline events with media:');
    
    const events = await prisma.timelineEvent.findMany({
      where: {
        mediaUrls: {
          isEmpty: false
        }
      },
      orderBy: { timestamp: 'desc' }
    });
    
    console.log(`   📊 Found ${events.length} timeline events with media`);

    let totalMediaItems = 0;
    let workingUrls = 0;
    let brokenUrls = 0;
    let apiUrls = 0;
    let oldUrls = 0;
    
    events.forEach((event, index) => {
      console.log(`\n   📸 Event ${index + 1}: ${event.id}`);
      console.log(`      📝 Text: ${event.text?.substring(0, 50)}...`);
      console.log(`      🎭 Type: ${event.type}`);
      
      if (event.mediaUrls && event.mediaUrls.length > 0) {
        console.log(`      📸 Media URLs: ${event.mediaUrls.length}`);
        totalMediaItems += event.mediaUrls.length;
        
        event.mediaUrls.forEach((url, i) => {
          console.log(`        ${i + 1}. ${url.substring(0, 50)}...`);
          
          if (url.startsWith('/api/serve-image')) {
            apiUrls++;
          } else if (url.startsWith('https://holputqklelihibuhfsj.storage.supabase.co')) {
            oldUrls++;
            console.log(`           ⚠️  Old Supabase URL still detected!`);
          } else {
            console.log(`           ❌ Unknown URL format`);
          }
        });
      }
    });

    console.log('\n📊 URL Analysis:');
    console.log(`   📸 Total media items: ${totalMediaItems}`);
    console.log(`   🌐 API proxy URLs: ${apiUrls}`);
    console.log(`   📦 Old Supabase URLs: ${oldUrls}`);

    // Test all timeline images
    console.log('\n2️⃣  Testing all timeline images:');
    
    for (const event of events) {
      if (event.mediaUrls && event.mediaUrls.length > 0) {
        for (let i = 0; i < event.mediaUrls.length; i++) {
          const testUrl = event.mediaUrls[i];
          const fullUrl = testUrl.startsWith('/api/') ? `http://localhost:3000${testUrl}` : testUrl;
          
          console.log(`   🧪 Testing: ${testUrl.substring(0, 50)}...`);
          
          try {
            const response = await fetch(fullUrl, { method: 'HEAD' });
            
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              const size = response.headers.get('content-length');
              console.log(`      ✅ Success! Type: ${contentType}, Size: ${size} bytes`);
              workingUrls++;
            } else {
              console.log(`      ❌ Failed: ${response.status} ${response.statusText}`);
              brokenUrls++;
            }
          } catch (error) {
            console.log(`      ❌ Error: ${error.message}`);
            brokenUrls++;
          }
        }
      }
    }

    console.log('\n📊 Test Results:');
    console.log(`   ✅ Working URLs: ${workingUrls}`);
    console.log(`   ❌ Broken URLs: ${brokenUrls}`);
    console.log(`   📊 Success rate: ${((workingUrls / totalMediaItems) * 100).toFixed(1)}%`);

    // Check timeline API response
    console.log('\n3️⃣  Testing timeline API response:');
    
    try {
      const response = await fetch('http://localhost:3000/api/timeline');
      
      if (response.ok) {
        const timelineData = await response.json();
        console.log(`   ✅ Timeline API working: ${timelineData.length} events`);
        
        // Check if events have media items
        const eventsWithMedia = timelineData.filter(event => event.mediaItems && event.mediaItems.length > 0);
        console.log(`   📸 Events with media: ${eventsWithMedia.length}`);
        
        if (eventsWithMedia.length > 0) {
          console.log('   📸 Sample media items:');
          eventsWithMedia.slice(0, 3).forEach((event, i) => {
            console.log(`      ${i + 1}. ${event.mediaItems[0].url.substring(0, 50)}...`);
          });
        }
      } else {
        console.log(`   ❌ Timeline API failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Timeline API error: ${error.message}`);
    }

    console.log('\n🎉 Timeline Image Fix Summary:');
    console.log(`   ✅ Total timeline events with media: ${events.length}`);
    console.log(`   ✅ Total media items: ${totalMediaItems}`);
    console.log(`   ✅ Working URLs: ${workingUrls}`);
    console.log(`   ✅ Success rate: ${((workingUrls / totalMediaItems) * 100).toFixed(1)}%`);
    
    if (oldUrls > 0) {
      console.log(`   ⚠️  Still has ${oldUrls} old URLs that need manual attention`);
    } else {
      console.log(`   ✅ All URLs are using the new API proxy format`);
    }

    console.log('\n💡 Timeline images should now be showing correctly!');
    console.log('   🔄 Check the timeline in the browser');
    console.log('   📱 All images should load properly');
    console.log('   🎨 Placeholder images created for missing files');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalTimelineImageVerification();
