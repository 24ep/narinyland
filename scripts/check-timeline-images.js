// Check timeline image migration status
import { PrismaClient } from '@prisma/client';

async function checkTimelineImages() {
  console.log('🔍 Checking Timeline Image Migration Status...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all timeline events
    console.log('1️⃣  Getting all timeline events:');
    
    const events = await prisma.timelineEvent.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    });
    
    console.log(`   📊 Found ${events.length} timeline events`);
    
    if (events.length === 0) {
      console.log('   ⚠️  No timeline events found');
      return;
    }

    console.log('\n2️⃣  Analyzing image URLs in timeline events:');
    
    let totalMediaItems = 0;
    let validUrls = 0;
    let invalidUrls = 0;
    let s3Keys = 0;
    let oldUrls = 0;
    let apiUrls = 0;
    
    events.forEach((event, index) => {
      console.log(`\n   📸 Event ${index + 1}: ${event.id}`);
      console.log(`      📝 Text: ${event.text?.substring(0, 50)}...`);
      console.log(`      🎭 Type: ${event.type}`);
      console.log(`      📍 Location: ${event.location}`);
      
      // Check media URLs
      if (event.mediaUrls && event.mediaUrls.length > 0) {
        console.log(`      📸 Media URLs: ${event.mediaUrls.length}`);
        totalMediaItems += event.mediaUrls.length;
        
        event.mediaUrls.forEach((url, i) => {
          console.log(`        ${i + 1}. ${url}`);
          
          if (url.startsWith('/api/serve-image')) {
            apiUrls++;
            validUrls++;
          } else if (url.startsWith('https://holputqklelihibuhfsj.storage.supabase.co')) {
            oldUrls++;
            console.log(`           ⚠️  Old Supabase URL detected`);
          } else if (url.startsWith('https://t3.storageapi.dev')) {
            validUrls++;
            console.log(`           ✅ New S3 URL detected`);
          } else {
            invalidUrls++;
            console.log(`           ❌ Invalid URL format`);
          }
        });
      } else {
        console.log(`      📸 No media URLs`);
      }
      
      // Check S3 keys
      if (event.mediaS3Keys && event.mediaS3Keys.length > 0) {
        console.log(`      🔑 S3 Keys: ${event.mediaS3Keys.length}`);
        s3Keys += event.mediaS3Keys.length;
        
        event.mediaS3Keys.forEach((key, i) => {
          console.log(`        ${i + 1}. ${key}`);
        });
      } else {
        console.log(`      🔑 No S3 keys`);
      }
      
      // Check media types
      if (event.mediaTypes && event.mediaTypes.length > 0) {
        console.log(`      🎨 Media Types: ${event.mediaTypes.join(', ')}`);
      }
    });

    console.log('\n📊 Summary:');
    console.log(`   📸 Total media items: ${totalMediaItems}`);
    console.log(`   ✅ Valid URLs: ${validUrls}`);
    console.log(`   ❌ Invalid URLs: ${invalidUrls}`);
    console.log(`   🔑 S3 keys: ${s3Keys}`);
    console.log(`   📦 Old Supabase URLs: ${oldUrls}`);
    console.log(`   🌐 API URLs: ${apiUrls}`);

    // Test a few timeline images
    console.log('\n3️⃣  Testing timeline image accessibility:');
    
    for (let i = 0; i < Math.min(3, events.length); i++) {
      const event = events[i];
      
      if (event.mediaUrls && event.mediaUrls.length > 0) {
        const testUrl = event.mediaUrls[0];
        const fullUrl = testUrl.startsWith('/api/') ? `http://localhost:3000${testUrl}` : testUrl;
        
        console.log(`   🧪 Testing: ${testUrl.substring(0, 50)}...`);
        
        try {
          const response = await fetch(fullUrl, { method: 'HEAD' });
          console.log(`      📊 Status: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            const size = response.headers.get('content-length');
            console.log(`      ✅ Success! Type: ${contentType}, Size: ${size} bytes`);
          } else {
            console.log(`      ❌ Failed: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.log(`      ❌ Error: ${error.message}`);
        }
      }
    }

    console.log('\n🎯 Migration Assessment:');
    
    if (oldUrls > 0) {
      console.log(`   ⚠️  Found ${oldUrls} old Supabase URLs that need migration`);
      console.log('   🔧 These URLs may not be accessible');
    }
    
    if (apiUrls > 0) {
      console.log(`   ✅ Found ${apiUrls} API proxy URLs that should work`);
    }
    
    if (invalidUrls > 0) {
      console.log(`   ❌ Found ${invalidUrls} invalid URL formats`);
      console.log('   🔧 These URLs need to be fixed');
    }
    
    if (s3Keys === 0 && totalMediaItems > 0) {
      console.log(`   ⚠️  No S3 keys found but ${totalMediaItems} media items exist`);
      console.log('   🔧 Migration may be incomplete');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimelineImages();
