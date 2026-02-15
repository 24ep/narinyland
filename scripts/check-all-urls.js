import { PrismaClient } from '@prisma/client';

// Check ALL URLs in database
async function checkAllUrls() {
  console.log('🔍 Checking ALL URLs in database...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get ALL memories
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          not: null,
          not: ''
        } 
      }
    });
    
    console.log(`📸 Total memories: ${memories.length}\n`);

    let working = 0;
    let failed = 0;
    let issues = [];

    for (const memory of memories) {
      try {
        const fullUrl = `http://localhost:3000${memory.url}`;
        const response = await fetch(fullUrl, { method: 'HEAD' });
        
        if (response.ok) {
          working++;
        } else {
          failed++;
          issues.push({
            id: memory.id,
            url: memory.url,
            status: response.status,
            statusText: response.statusText
          });
        }
      } catch (error) {
        failed++;
        issues.push({
          id: memory.id,
          url: memory.url,
          error: error.message
        });
      }
    }

    console.log(`📊 Results:`);
    console.log(`  ✅ Working: ${working}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📊 Success Rate: ${Math.round((working / memories.length) * 100)}%`);

    if (issues.length > 0) {
      console.log(`\n❌ Issues found:`);
      issues.forEach(issue => {
        console.log(`  ID: ${issue.id}`);
        console.log(`  URL: ${issue.url}`);
        console.log(`  Problem: ${issue.status ? `${issue.status} ${issue.statusText}` : issue.error}`);
        console.log('');
      });
    }

    // Check for any URLs that don't start with /api/serve-image
    const nonApiUrls = memories.filter(m => !m.url.startsWith('/api/serve-image'));
    
    if (nonApiUrls.length > 0) {
      console.log(`\n⚠️  Non-API URLs found (${nonApiUrls.length}):`);
      nonApiUrls.forEach(memory => {
        console.log(`  ${memory.url}`);
      });
    }

    // Show all unique URL patterns
    const urlPatterns = [...new Set(memories.map(m => {
      if (m.url.includes('placeholder-')) return 'placeholder-svg';
      if (m.url.includes('gallery/') && m.url.includes('.jpg')) return 'original-jpg';
      if (m.url.includes('gallery/') && m.url.includes('.png')) return 'original-png';
      return 'other';
    }))];
    
    console.log(`\n📊 URL Patterns:`);
    urlPatterns.forEach(pattern => {
      const count = memories.filter(m => {
        if (pattern === 'placeholder-svg') return m.url.includes('placeholder-');
        if (pattern === 'original-jpg') return m.url.includes('gallery/') && m.url.includes('.jpg');
        if (pattern === 'original-png') return m.url.includes('gallery/') && m.url.includes('.png');
        return false;
      }).length;
      console.log(`  ${pattern}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUrls().catch(console.error);
