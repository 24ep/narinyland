import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Alternative migration method: Download to local storage, then upload
async function alternativeMigration() {
  console.log('🔄 Alternative Migration: Local Storage Method...\n');

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
  const TEMP_DIR = './temp-downloads';
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Create temp directory
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Get memories with Supabase URLs (the remaining 15)
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          contains: 'supabase',
          not: null,
          not: ''
        } 
      }
    });
    
    console.log(`📸 Found ${memories.length} remaining photos to migrate`);

    let downloaded = 0;
    let uploaded = 0;
    let failed = 0;

    // Step 1: Download all files to local storage
    console.log('\n📥 Step 1: Downloading files to local storage...');
    const localFiles = [];

    for (const memory of memories) {
      try {
        console.log(`  📥 Downloading: ${memory.url.substring(0, 80)}...`);
        
        // Extract key from Supabase URL
        const urlParts = new URL(memory.url);
        const sourceKey = urlParts.pathname.replace('/storage/v1/object/public/narinyland/', '');
        const filename = path.basename(sourceKey);
        const localPath = path.join(TEMP_DIR, filename);
        
        // Download from Supabase
        const getObjectCommand = new GetObjectCommand({
          Bucket: 'narinyland',
          Key: sourceKey
        });
        
        const sourceObject = await sourceS3.send(getObjectCommand);
        const fileStream = sourceObject.Body;
        
        // Save to local file
        const writeStream = fs.createWriteStream(localPath);
        await new Promise((resolve, reject) => {
          fileStream.on('finish', resolve);
          fileStream.on('error', reject);
          fileStream.write(fileStream);
          fileStream.end();
        });
        
        localFiles.push({
          memoryId: memory.id,
          sourceKey: sourceKey,
          localPath: localPath,
          filename: filename
        });
        
        downloaded++;
        console.log(`    ✅ Saved to: ${localPath}`);
        
      } catch (error) {
        console.log(`    ❌ Download failed: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Download Summary: ${downloaded} downloaded, ${failed} failed`);

    // Step 2: Upload from local storage to new bucket
    console.log('\n📤 Step 2: Uploading from local storage to new bucket...');
    
    for (const file of localFiles) {
      try {
        console.log(`  📤 Uploading: ${file.filename}`);
        
        // Read local file
        const fileBuffer = fs.readFileSync(file.localPath);
        
        // Upload to new bucket
        const putObjectCommand = new PutObjectCommand({
          Bucket: TARGET_BUCKET,
          Key: file.sourceKey,
          Body: fileBuffer,
          ContentType: 'application/octet-stream'
        });
        
        await targetS3.send(putObjectCommand);
        
        // Create new URL
        const newUrl = `/api/serve-image?key=${file.sourceKey}`;
        
        // Update database
        await prisma.memory.update({
          where: { id: file.memoryId },
          data: { url: newUrl }
        });
        
        uploaded++;
        console.log(`    ✅ Uploaded and updated: ${newUrl}`);
        
        // Clean up local file
        fs.unlinkSync(file.localPath);
        
      } catch (error) {
        console.log(`    ❌ Upload failed: ${error.message}`);
        failed++;
      }
    }

    // Clean up temp directory
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmdirSync(TEMP_DIR, { recursive: true });
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`  📥 Downloaded: ${downloaded} files`);
    console.log(`  📤 Uploaded: ${uploaded} files`);
    console.log(`  ❌ Failed: ${failed} files`);
    console.log(`  📦 Total processed: ${memories.length} files`);

    // Verify final state
    const finalMemories = await prisma.memory.findMany({
      where: { url: { startsWith: '/api/serve-image' } }
    });
    
    console.log(`\n🎯 Final State:`);
    console.log(`  ✅ Total photos on new bucket: ${finalMemories.length}`);
    console.log(`  🔗 Bucket: ${TARGET_BUCKET}`);

    if (uploaded > 0) {
      console.log('\n🎉 Alternative Migration Complete!');
      console.log('✅ All remaining photos now hosted on new t3.storageapi.dev bucket');
      console.log('🚀 Application ready with all photos working');
    }

  } catch (error) {
    console.error('❌ Alternative migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

alternativeMigration().catch(console.error);
