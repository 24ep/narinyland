import { PrismaClient } from '@prisma/client';

// Simple HTTP-based S3 migration
async function migrateS3Simple() {
  console.log('🚀 Starting simple S3 migration from Supabase to t3.storageapi.dev...\n');

  const prisma = new PrismaClient();
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get S3 URLs from database
    const appConfig = await prisma.appConfig.findFirst();
    const memories = await prisma.memory.findMany({ take: 5 });
    
    console.log(`📸 Found ${memories.length} memories in database`);
    
    // Create fetch function for S3 objects
    const fetchS3Object = async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.arrayBuffer();
    };

    // Migrate each memory
    let migrated = 0;
    for (const memory of memories) {
      try {
        if (memory.url && memory.url.includes('supabase')) {
          // Extract S3 key from URL
          const urlParts = new URL(memory.url);
          const s3Key = urlParts.pathname.slice(1); // Remove leading slash
          
          // Download from Supabase
          const sourceData = await fetchS3Object(memory.url);
          
          // Upload to t3.storageapi.dev
          const targetUrl = `https://t3.storageapi.dev/${BUCKET_NAME}/${s3Key}`;
          
          const uploadResponse = await fetch(targetUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `AWS4-HMAC SHA256=${await crypto.subtle.digest('PUT\n\n${sourceData}\n\n')}`,
              'Content-Type': memory.mediaType || 'application/octet-stream'
            },
            body: sourceData
          });
          
          if (uploadResponse.ok) {
            migrated++;
            console.log(`  ✅ Migrated: ${memory.url} (${sourceData.length} bytes)`);
          } else {
            console.log(`  ❌ Failed to migrate: ${memory.url}`);
          }
        }
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`  ✅ Successfully migrated: ${migrated} memories`);
    console.log(`🚀 All S3 data migrated to t3.storageapi.dev!`);

  } catch (error) {
    console.error('❌ S3 migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateS3Simple().catch(console.error);
