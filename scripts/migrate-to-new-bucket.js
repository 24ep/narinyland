import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Migrate files from old t3.storageapi.dev bucket to new bucket
async function migrateToNewBucket() {
  console.log('🚀 Migrating files to new t3.storageapi.dev bucket...\n');

  // Source: Old t3.storageapi.dev bucket
  const sourceS3 = new S3Client({
    region: 'auto',
    credentials: {
      accessKeyId: 'tid_dZVznlirLettMmvYPFhOFebQsLAsShgSfVrkrNLiWZcznwGHAK',
      secretAccessKey: 'tsec_1-RbxBo4SH0Kpu0os0mKIqJHe9uWqXissEb9X2hcIK9Y44P5GIkwZY2HiYxzKoQuTN5VvU',
    },
    endpoint: 'https://t3.storageapi.dev',
    forcePathStyle: true
  });

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
  const SOURCE_BUCKET = 'convenient-crate-fpoysecg';
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
        
        // Extract key from current URL
        const urlParts = new URL(memory.url);
        const sourceKey = urlParts.pathname.replace(`/${SOURCE_BUCKET}/`, '');
        
        // Download from old bucket
        const getObjectCommand = new GetObjectCommand({
          Bucket: SOURCE_BUCKET,
          Key: sourceKey
        });
        
        const sourceObject = await sourceS3.send(getObjectCommand);
        const fileStream = sourceObject.Body;
        
        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of fileStream) {
          chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);
        
        console.log(`  📥 Downloaded ${fileBuffer.length} bytes`);
        
        // Upload to new bucket
        const putObjectCommand = new PutObjectCommand({
          Bucket: TARGET_BUCKET,
          Key: sourceKey,
          Body: fileBuffer,
          ContentType: sourceObject.ContentType || 'application/octet-stream'
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
    }

  } catch (error) {
    console.error('❌ Bucket migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateToNewBucket().catch(console.error);
