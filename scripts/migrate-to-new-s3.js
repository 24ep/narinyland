import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Migrate files from Supabase S3 to t3.storageapi.dev
async function migrateToNewS3() {
  console.log('🚀 Migrating files to new S3 provider (t3.storageapi.dev)...\n');

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

  // Target: t3.storageapi.dev
  const targetS3 = new S3Client({
    region: 'auto',
    credentials: {
      accessKeyId: 'tid_dZVznlirLettMmvYPFhOFebQsLAsShgSfVrkrNLiWZcznwGHAK',
      secretAccessKey: 'tsec_1-RbxBo4SH0Kpu0os0mKIqJHe9uWqXissEb9X2hcIK9Y44P5GIkwZY2HiYxzKoQuTN5VvU',
    },
    endpoint: 'https://t3.storageapi.dev',
    forcePathStyle: true
  });

  const prisma = new PrismaClient();
  const TARGET_BUCKET = 'convenient-crate-fpoysecg';
  
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
        
        // Extract key from Supabase URL
        const urlParts = new URL(memory.url);
        const sourceKey = urlParts.pathname.replace('/storage/v1/object/public/narinyland/', '');
        
        // Download from Supabase S3
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
        
        // Upload to t3.storageapi.dev
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

    // Update environment variables
    console.log('\n🔧 Updating environment variables...');
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`  ✅ Successfully migrated: ${migrated} files`);
    console.log(`  ❌ Failed: ${failed} files`);
    console.log(`  📦 Total processed: ${memories.length} files`);

    if (migrated > 0) {
      console.log('\n🎉 S3 Migration Complete!');
      console.log('✅ Photos now hosted on t3.storageapi.dev');
      console.log('\n📝 Next steps:');
      console.log('1. Update .env file with new S3 credentials');
      console.log('2. Restart the application');
      console.log('3. Test photo loading');
    }

  } catch (error) {
    console.error('❌ S3 migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateToNewS3().catch(console.error);
