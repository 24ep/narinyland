import { PrismaClient } from '@prisma/client';

// Check actual URLs in database
async function checkActualUrls() {
  console.log('🔍 Checking actual URLs in database...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get first few memories to see actual URLs
    const memories = await prisma.memory.findMany({ take: 5 });
    
    console.log(`📸 Found ${memories.length} memories:`);
    
    for (const memory of memories) {
      console.log(`  📋 URL: ${memory.url}`);
      
      if (memory.url && memory.url.includes('supabase')) {
        const urlParts = new URL(memory.url);
        const pathParts = urlParts.pathname.split('/');
        console.log(`    📁 Path parts: ${pathParts.join(' -> ')}`);
        console.log(`    📁 Full path: ${urlParts.pathname}`);
        
        // Try to extract the actual filename
        const galleryIndex = pathParts.indexOf('gallery');
        if (galleryIndex !== -1) {
          const filename = pathParts.slice(galleryIndex + 1).join('/');
          console.log(`    📄 Extracted filename: ${filename}`);
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkActualUrls().catch(console.error);
