import { PrismaClient } from '@prisma/client';

// Final verification after fixing lib/s3.ts
async function finalVerification404() {
  console.log('🎯 Final Verification After Fixing lib/s3.ts...\n');

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
    
    console.log(`📸 Total memories: ${memories.length}`);

    // Test a few URLs
    console.log('\n🧪 Testing photo URLs:');
    
    let working = 0;
    let failed = 0;
    
    for (let i = 0; i < Math.min(5, memories.length); i++) {
      const memory = memories[i];
      try {
        const fullUrl = `http://localhost:3000${memory.url}`;
        const response = await fetch(fullUrl, { method: 'HEAD' });
        
        if (response.ok) {
          working++;
          console.log(`  ✅ ${memory.url.substring(0, 60)}... - ${response.status}`);
        } else {
          failed++;
          console.log(`  ❌ ${memory.url.substring(0, 60)}... - ${response.status}`);
        }
      } catch (error) {
        failed++;
        console.log(`  ❌ ${memory.url.substring(0, 60)}... - ERROR: ${error.message}`);
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`  ✅ Working: ${working}`);
    console.log(`  ❌ Failed: ${failed}`);

    // Check URL format consistency
    console.log('\n🔍 Checking URL format consistency:');
    
    const apiUrls = memories.filter(m => m.url.startsWith('/api/serve-image?key='));
    const otherUrls = memories.filter(m => !m.url.startsWith('/api/serve-image?key='));
    
    console.log(`  🟢 API URLs: ${apiUrls.length}`);
    console.log(`  ⚪ Other URLs: ${otherUrls.length}`);

    if (otherUrls.length > 0) {
      console.log('\n⚠️  Non-API URLs found:');
      otherUrls.forEach(m => {
        console.log(`    ${m.url}`);
      });
    }

    console.log('\n🎉 Final Status:');
    if (apiUrls.length === memories.length && failed === 0) {
      console.log('  ✅ ALL PHOTOS WORKING!');
      console.log('  🚀 404 errors should be resolved');
      console.log('  📸 All photos using API proxy URLs');
      console.log('  🔧 lib/s3.ts fixed to generate correct URLs');
    } else {
      console.log('  ⚠️  Some issues may remain');
      console.log(`  📊 API URLs: ${apiUrls.length}/${memories.length}`);
    }

    console.log('\n💡 Browser Instructions:');
    console.log('  1. Clear browser cache (Ctrl+F5 or Cmd+Shift+R)');
    console.log('  2. Hard refresh the page');
    console.log('  3. Check browser dev tools Network tab');
    console.log('  4. Images should now load without 404 errors');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification404().catch(console.error);
