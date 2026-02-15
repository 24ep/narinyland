import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Migrate files from Supabase to new t3.storageapi.dev bucket
async function migrateSupabaseToNewBucket() {
  console.log('🚀 Migrating files from Supabase to new t3.storageapi.dev bucket...\n');

  // Source: Supabase S3
  const sourceS3 = new S3Client({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: 'bf33578637c07715b40a6871633f8dda',
      secretAccessKey: '6bb5eaf15dfaae132a227513de2597d4f41cf1c61445f3db6b56f6424da2fd7a',
    },
    endpoint: 'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/s3',
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
  const TARGET_BUCKET = 'narinlyland-storage-mek5-t';
  
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
    
    console.log(`📸 Found ${memories.length} memories to migrate`);
    
    let migrated = 0;
    let failed = 0;

    for (const memory of memories) {
      try {
        console.log(`\n📤 Processing: ${memory.url}`);
        
        // Try to extract key from current URL
        let sourceKey = '';
        if (memory.url.includes('supabase')) {
          const urlParts = new URL(memory.url);
          sourceKey = urlParts.pathname.replace('/storage/v1/object/public/narinyland/', '');
        } else if (memory.url.includes('t3.storageapi.dev')) {
          const urlParts = new URL(memory.url);
          sourceKey = urlParts.pathname.replace('/convenient-crate-fpoysecg/', '');
        }
        
        if (!sourceKey) {
          throw new Error('Could not extract source key');
        }
        
        // Download from Supabase
        const getObjectCommand = new GetObjectCommand({
          Bucket: 'narinyland',
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
      console.log('\n🎉 Migration to New Bucket Complete!');
      console.log('✅ Photos now hosted on new t3.storageapi.dev bucket');
      console.log(`🔗 New bucket: ${TARGET_BUCKET}`);
      console.log('\n📝 Configuration already updated in .env file');
      console.log('🚀 Application ready to use new bucket');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateSupabaseToNewBucket().catch(console.error);
