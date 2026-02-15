import { PrismaClient } from '@prisma/client';

// Browser debugging - check what URLs might be causing 404s
async function browserDebug() {
  console.log('🌐 Browser Debugging...\n');

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
    
    console.log(`📸 Checking potential browser issues...\n`);

    // Test different URL formats that might be causing 404s
    const potentialIssues = [
      // Old API route format
      '/api/photos/gallery/',
      // Missing query parameter
      '/api/serve-image',
      // Wrong endpoint
      '/api/photo',
      // Direct S3 URLs
      'https://t3.storageapi.dev/',
      // Supabase URLs
      'https://holputqklelihibuhfsj.storage.supabase.co/'
    ];

    console.log('🔍 Checking for common 404 patterns:');
    
    for (const pattern of potentialIssues) {
      const matchingMemories = memories.filter(m => m.url.includes(pattern));
      if (matchingMemories.length > 0) {
        console.log(`\n⚠️  Found ${matchingMemories.length} URLs with pattern: ${pattern}`);
        matchingMemories.slice(0, 3).forEach(m => {
          console.log(`  ${m.url}`);
        });
      }
    }

    // Check if any URLs are malformed
    console.log('\n🔍 Checking for malformed URLs:');
    
    const malformed = memories.filter(m => {
      const url = m.url;
      return !url.startsWith('/api/serve-image?key=') || 
             !url.includes('gallery/') ||
             url.length < 20;
    });
    
    if (malformed.length > 0) {
      console.log(`⚠️  Found ${malformed.length} potentially malformed URLs:`);
      malformed.forEach(m => {
        console.log(`  ${m.url}`);
      });
    } else {
      console.log('✅ No malformed URLs found');
    }

    // Test a few URLs with different methods
    console.log('\n🧪 Testing with different HTTP methods:');
    
    const testMemory = memories[0];
    if (testMemory) {
      const fullUrl = `http://localhost:3000${testMemory.url}`;
      
      try {
        // Test GET request (like browser image load)
        const getResponse = await fetch(fullUrl, { method: 'GET' });
        console.log(`  GET: ${getResponse.status} ${getResponse.statusText}`);
        
        // Test HEAD request
        const headResponse = await fetch(fullUrl, { method: 'HEAD' });
        console.log(`  HEAD: ${headResponse.status} ${headResponse.statusText}`);
        
      } catch (error) {
        console.log(`  Error: ${error.message}`);
      }
    }

    // Check if there are any timeline events with image URLs
    console.log('\n📅 Checking timeline events with images:');
    
    const timelineEvents = await prisma.timelineEvent.findMany({
      where: { 
        imageUrl: { 
          not: null,
          not: ''
        } 
      }
    });
    
    if (timelineEvents.length > 0) {
      console.log(`  Found ${timelineEvents.length} timeline events with images:`);
      timelineEvents.slice(0, 3).forEach(event => {
        console.log(`    ${event.imageUrl}`);
      });
      
      // Test timeline image URLs
      for (const event of timelineEvents.slice(0, 3)) {
        try {
          const response = await fetch(`http://localhost:3000${event.imageUrl}`, { method: 'HEAD' });
          console.log(`    ${event.imageUrl} - ${response.status}`);
        } catch (error) {
          console.log(`    ${event.imageUrl} - ERROR: ${error.message}`);
        }
      }
    } else {
      console.log('  No timeline events with images found');
    }

    console.log('\n💡 Browser Debugging Tips:');
    console.log('  1. Clear browser cache (Ctrl+F5 or Cmd+Shift+R)');
    console.log('  2. Check browser dev tools Network tab for failed requests');
    console.log('  3. Verify the application is using the correct URLs from database');
    console.log('  4. Check if there are any hardcoded URLs in the frontend code');

  } catch (error) {
    console.error('❌ Browser debug failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

browserDebug().catch(console.error);
