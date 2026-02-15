import { PrismaClient } from '@prisma/client';

// Check what URLs are actually in the database for memories
async function checkMemoryUrls() {
  console.log('🔍 Checking memory URLs in database...\n');

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
      },
      take: 10
    });
    
    console.log(`📸 Sample memory URLs:\n`);

    for (const memory of memories) {
      console.log(`🔗 ${memory.url}`);
      
      // Test if it's a relative URL that needs full domain
      if (memory.url.startsWith('/api/')) {
        const fullUrl = `http://localhost:3000${memory.url}`;
        try {
          const response = await fetch(fullUrl, { method: 'HEAD' });
          console.log(`  ✅ Full URL works: ${response.status}`);
        } catch (error) {
          console.log(`  ❌ Full URL failed: ${error.message}`);
        }
      }
    }

    console.log('\n💡 Issue Analysis:');
    console.log('  - Database contains relative URLs: /api/serve-image?key=...');
    console.log('  - Browser needs full URLs: http://localhost:3000/api/serve-image?key=...');
    console.log('  - getDisplayUrl() function should convert relative to full URLs');

  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkMemoryUrls().catch(console.error);
