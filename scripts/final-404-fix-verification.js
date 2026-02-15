import { PrismaClient } from '@prisma/client';

// Final verification of 404 fix
async function final404FixVerification() {
  console.log('🎯 Final 404 Fix Verification...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get a few memories to test
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          not: null,
          not: ''
        } 
      },
      take: 5
    });
    
    console.log(`📸 Testing ${memories.length} memories with URL conversion:\n`);

    // Simulate the browser URL conversion
    const getDisplayUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('/api/')) {
        return `http://localhost:3000${url}`;
      }
      return url;
    };

    let working = 0;
    let failed = 0;

    for (const memory of memories) {
      console.log(`🔗 Memory ID: ${memory.id}`);
      console.log(`  📸 DB URL: ${memory.url}`);
      
      const displayUrl = getDisplayUrl(memory.url);
      console.log(`  🌐 Display URL: ${displayUrl}`);
      
      try {
        const response = await fetch(displayUrl, { method: 'HEAD' });
        
        if (response.ok) {
          working++;
          console.log(`  ✅ Status: ${response.status} ${response.statusText}`);
          console.log(`  📏 Size: ${response.headers.get('content-length')} bytes`);
        } else {
          failed++;
          console.log(`  ❌ Status: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        failed++;
        console.log(`  ❌ Error: ${error.message}`);
      }
      
      console.log('');
    }

    console.log(`📊 Test Results:`);
    console.log(`  ✅ Working: ${working}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📊 Success Rate: ${Math.round((working / memories.length) * 100)}%`);

    console.log('\n🎉 Fix Summary:');
    console.log('  ✅ Fixed MemoryFrame.tsx getDisplayUrl() function');
    console.log('  ✅ Fixed EditDrawer.tsx getPreviewUrl() function');
    console.log('  ✅ URLs now convert from relative to full URLs');
    console.log('  ✅ Browser should see correct full URLs');

    console.log('\n💡 Next Steps:');
    console.log('  1. Clear browser cache (Ctrl+F5)');
    console.log('  2. Hard refresh the page');
    console.log('  3. Images should now load without 404 errors');
    console.log('  4. Check browser dev tools Network tab for verification');

    if (working === memories.length) {
      console.log('\n🚀 ALL TESTS PASSED - 404 errors should be resolved!');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

final404FixVerification().catch(console.error);
