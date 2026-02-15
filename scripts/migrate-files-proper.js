import { PrismaClient } from '@prisma/client';

// Proper file migration from Supabase to t3.storageapi.dev
async function migrateFilesProper() {
  console.log('🚀 Migrating files from Supabase to t3.storageapi.dev...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all memories with Supabase URLs
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          contains: 'supabase',
          not: null,
          not: ''
        } 
      }
    });
    
    console.log(`📸 Found ${memories.length} memories to migrate`);
    
    let migrated = 0;
    let failed = 0;

    for (const memory of memories) {
      try {
        console.log(`\n📤 Processing: ${memory.url}`);
        
        // Download file from Supabase
        const response = await fetch(memory.url);
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }
        
        const fileData = await response.arrayBuffer();
        console.log(`  📥 Downloaded ${fileData.length} bytes`);
        
        // Extract filename from Supabase URL
        const urlParts = new URL(memory.url);
        const pathParts = urlParts.pathname.split('/');
        const filename = pathParts[pathParts.length - 1];
        
        // Create new URL for t3.storageapi.dev
        const newUrl = `https://t3.storageapi.dev/convenient-crate-fpoysecg/${filename}`;
        
        // Upload to t3.storageapi.dev
        const uploadResponse = await fetch(newUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': `Bearer ${process.env.S3_ACCESS_KEY_ID}:${process.env.S3_SECRET_ACCESS_KEY}`
          },
          body: fileData
        });
        
        if (uploadResponse.ok) {
          // Update database with new URL
          await prisma.memory.update({
            where: { id: memory.id },
            data: { url: newUrl }
          });
          
          migrated++;
          console.log(`  ✅ Uploaded and updated: ${newUrl}`);
        } else {
          console.log(`  ❌ Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
          failed++;
        }
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        failed++;
      }
    }

    // Test one of the migrated URLs
    if (migrated > 0) {
      console.log('\n🔍 Testing migrated URLs...');
      const testMemory = await prisma.memory.findFirst({
        where: { url: { contains: 't3.storageapi.dev' } }
      });
      
      if (testMemory) {
        try {
          const testResponse = await fetch(testMemory.url);
          console.log(`  🧪 Test URL: ${testMemory.url}`);
          console.log(`  📊 Response: ${testResponse.status} ${testResponse.statusText}`);
        } catch (error) {
          console.log(`  ❌ Test failed: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`  ✅ Successfully migrated: ${migrated} files`);
    console.log(`  ❌ Failed: ${failed} files`);
    console.log(`  📦 Total processed: ${memories.length} files`);

    if (migrated > 0) {
      console.log('\n🎉 File Migration Complete!');
      console.log('✅ Photos should now load from t3.storageapi.dev');
    }

  } catch (error) {
    console.error('❌ File migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateFilesProper().catch(console.error);
