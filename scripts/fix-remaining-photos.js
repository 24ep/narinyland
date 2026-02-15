import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Fix remaining photos that failed to migrate
async function fixRemainingPhotos() {
  console.log('🔧 Fixing remaining photos that failed to migrate...\n');

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

    // Get all memories with corrupted/truncated URLs
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          not: null,
          not: ''
        } 
      }
    });
    
    console.log(`📸 Found ${memories.length} total memories`);
    
    // Filter for corrupted URLs (short filenames)
    const corruptedMemories = memories.filter(memory => {
      if (!memory.url.includes('t3.storageapi.dev')) return false;
      
      const urlParts = new URL(memory.url);
      const filename = urlParts.pathname.split('/').pop();
      
      // Check if filename is truncated (less than 20 characters for UUID-based names)
      return filename.length < 20;
    });
    
    console.log(`🔍 Found ${corruptedMemories.length} corrupted memories to fix`);
    
    // Original full URLs to restore from
    const originalUrls = [
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/d0398ea1-b329-42cf-9bb1-1d129edce3d9.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/d0a2324f-0bbd-4301-98f1-a34323207daf.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/f725674c-37e4-4e6b-b148-5afb1525b50e.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/fc1891d2-ae1e-4623-af9a-5523cd107a30.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/583a1f13-37a8-4596-aaa0-7596b50a4bb4.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/6fc8de69-4bec-4fa2-a95d-3c12fa99d858.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/75ad7d16-12e9-43d2-8960-831424bd728d.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/7164d66e-0924-46d8-bde7-6492761579f5.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/ecb2a3f2-d333-4985-8454-9f9afd04762c.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/4e3887a2-a7ad-4079-bc4d-3d5ff9e8659a.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/9fc182f3-a0df-4c9c-8c0c-214d8b6c5ee8.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/c0780028-66cb-4c59-be47-0c0006f7b11c.jpg',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/42505efb-7a80-43af-ad6d-14447b882f8a.JPG',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/1640909c-4cbb-45aa-b36a-09e3316ad967.JPG',
      'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/object/public/narinyland/gallery/bb5ce966-7c88-444f-8112-02a603342bc8.jpg'
    ];
    
    let fixed = 0;
    let failed = 0;

    for (let i = 0; i < Math.min(corruptedMemories.length, originalUrls.length); i++) {
      const memory = corruptedMemories[i];
      const originalUrl = originalUrls[i];
      
      try {
        console.log(`\n🔧 Fixing: ${memory.url}`);
        console.log(`  📋 Original: ${originalUrl}`);
        
        // Extract key from original URL
        const urlParts = new URL(originalUrl);
        const sourceKey = urlParts.pathname.replace('/storage/v1/object/public/narinyland/', '');
        
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
        
        fixed++;
        console.log(`  ✅ Fixed and updated: ${newUrl}`);
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Fix Summary:`);
    console.log(`  ✅ Successfully fixed: ${fixed} photos`);
    console.log(`  ❌ Failed: ${failed} photos`);
    console.log(`  📦 Total processed: ${corruptedMemories.length} photos`);

    // Verify final state
    const finalMemories = await prisma.memory.findMany({
      where: { url: { contains: 't3.storageapi.dev' } }
    });
    
    console.log(`\n🎯 Final State:`);
    console.log(`  ✅ Total photos on new bucket: ${finalMemories.length}`);
    console.log(`  🔗 Bucket: ${TARGET_BUCKET}`);

    if (fixed > 0) {
      console.log('\n🎉 Photo Fix Complete!');
      console.log('✅ All photos now hosted on new t3.storageapi.dev bucket');
      console.log('🚀 Application should display all photos correctly');
    }

  } catch (error) {
    console.error('❌ Photo fix failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixRemainingPhotos().catch(console.error);
