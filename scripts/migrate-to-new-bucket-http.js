import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Migrate files using HTTP download to new t3.storageapi.dev bucket
async function migrateToNewBucketHttp() {
  console.log('🚀 Migrating files to new t3.storageapi.dev bucket via HTTP...\n');

  // Target: New t3.storageapi.dev bucket
  const targetS3 = new S3Client({
    region: 'auto',
    credentials: {
      accessKeyId: 'tid_XAzZ_TfRxbtP_zmDbkEXInccR_dWxETsuvicIJLgAvEpVKaWfK',
      secretAccessKey: 'tsec_z944r-dQQVzUA-74CtROSMYdkq7ERkovKgj6ccobo+ru8jUgW5oeaWd5liuGbxRDdhd_zc',
    },
    endpoint: 'https://t3.storageapi.dev',
    forcePathStyle: true
  });

  const prisma = new PrismaClient();
  const TARGET_BUCKET = 'narinlyland-storage-mek5-t';
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all memories with t3.storageapi.dev URLs
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          contains: 't3.storageapi.dev',
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
        
        // Download file via HTTP
        const response = await fetch(memory.url);
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }
        
        const fileBuffer = await response.arrayBuffer();
        console.log(`  📥 Downloaded ${fileBuffer.byteLength} bytes`);
        
        // Extract key from current URL
        const urlParts = new URL(memory.url);
        const sourceKey = urlParts.pathname.replace('/convenient-crate-fpoysecg/', '');
        
        // Upload to new bucket
        const putObjectCommand = new PutObjectCommand({
          Bucket: TARGET_BUCKET,
          Key: sourceKey,
          Body: new Uint8Array(fileBuffer),
          ContentType: 'application/octet-stream'
        });
        
        await targetS3.send(putObjectCommand);
        
        // Create new URL
        const newUrl = `https://t3.storageapi.dev/${TARGET_BUCKET}/${sourceKey}`;
        
        // Update database
        await prisma.memory.update({
          where: { id: memory.id },
          data: { url: newUrl }
        });
        
        migrated++;
        console.log(`  ✅ Uploaded and updated: ${newUrl}`);
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`  ✅ Successfully migrated: ${migrated} files`);
    console.log(`  ❌ Failed: ${failed} files`);
    console.log(`  📦 Total processed: ${memories.length} files`);

    if (migrated > 0) {
      console.log('\n🎉 Bucket Migration Complete!');
      console.log('✅ Photos now hosted on new t3.storageapi.dev bucket');
      console.log(`🔗 New bucket: ${TARGET_BUCKET}`);
      console.log('\n📝 Configuration updated in .env file');
      console.log('🚀 Application ready to use new bucket');
    }

  } catch (error) {
    console.error('❌ Bucket migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateToNewBucketHttp().catch(console.error);
