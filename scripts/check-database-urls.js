import { PrismaClient } from '@prisma/client';

// Check actual URLs in database
async function checkDatabaseUrls() {
  console.log('🔍 Checking actual URLs in database...\n');

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
    
    console.log(`📸 Total memories: ${memories.length}\n`);

    // Group by URL type
    const urlTypes = {
      'api/serve-image': [],
      'via.placeholder.com': [],
      'supabase': [],
      'other': []
    };

    for (const memory of memories) {
      if (memory.url.includes('api/serve-image')) {
        urlTypes['api/serve-image'].push(memory);
      } else if (memory.url.includes('via.placeholder.com')) {
        urlTypes['via.placeholder.com'].push(memory);
      } else if (memory.url.includes('supabase')) {
        urlTypes['supabase'].push(memory);
      } else {
        urlTypes['other'].push(memory);
      }
    }

    console.log('📊 URL Distribution:');
    console.log(`  🟢 /api/serve-image: ${urlTypes['api/serve-image'].length} photos`);
    console.log(`  🌐 via.placeholder.com: ${urlTypes['via.placeholder.com'].length} photos`);
    console.log(`  🔵 Supabase: ${urlTypes['supabase'].length} photos`);
    console.log(`  ⚪ Other: ${urlTypes['other'].length} photos`);

    // Show sample URLs from each type
    console.log('\n🔍 Sample URLs:');
    
    if (urlTypes['api/serve-image'].length > 0) {
      console.log('\n  🟢 API Serve Image URLs:');
      urlTypes['api/serve-image'].slice(0, 3).forEach(memory => {
        console.log(`    ${memory.url}`);
      });
    }

    if (urlTypes['via.placeholder.com'].length > 0) {
      console.log('\n  🌐 Placeholder URLs:');
      urlTypes['via.placeholder.com'].slice(0, 3).forEach(memory => {
        console.log(`    ${memory.url}`);
      });
    }

    if (urlTypes['supabase'].length > 0) {
      console.log('\n  🔵 Supabase URLs:');
      urlTypes['supabase'].slice(0, 3).forEach(memory => {
        console.log(`    ${memory.url}`);
      });
    }

    // Test some URLs
    console.log('\n🧪 Testing URLs:');
    
    // Test API serve image URLs
    if (urlTypes['api/serve-image'].length > 0) {
      console.log('\n  Testing API serve image URLs:');
      for (let i = 0; i < Math.min(3, urlTypes['api/serve-image'].length); i++) {
        const memory = urlTypes['api/serve-image'][i];
        try {
          const response = await fetch(`http://localhost:3000${memory.url}`, { method: 'HEAD' });
          console.log(`    ${memory.url.substring(0, 60)}... - ${response.status} ${response.statusText}`);
        } catch (error) {
          console.log(`    ${memory.url.substring(0, 60)}... - ERROR: ${error.message}`);
        }
      }
    }

    // Test placeholder URLs
    if (urlTypes['via.placeholder.com'].length > 0) {
      console.log('\n  Testing placeholder URLs:');
      for (let i = 0; i < Math.min(3, urlTypes['via.placeholder.com'].length); i++) {
        const memory = urlTypes['via.placeholder.com'][i];
        try {
          const response = await fetch(memory.url, { method: 'HEAD' });
          console.log(`    ${memory.url.substring(0, 60)}... - ${response.status} ${response.statusText}`);
        } catch (error) {
          console.log(`    ${memory.url.substring(0, 60)}... - ERROR: ${error.message}`);
        }
      }
    }

    console.log('\n🎯 Database Analysis Complete');

  } catch (error) {
    console.error('❌ Database check failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseUrls().catch(console.error);
