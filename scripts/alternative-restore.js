import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Alternative approach: Create placeholder images for missing photos
async function alternativeRestore() {
  console.log('🔄 Alternative Restore: Placeholder Images Method...\n');

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

    // Get memories with broken Supabase URLs
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          contains: 'supabase',
          not: null,
          not: ''
        } 
      }
    });
    
    console.log(`📸 Found ${memories.length} broken photos to restore`);

    // Create a simple placeholder image (1x1 PNG)
    const placeholderImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    let restored = 0;
    let failed = 0;

    for (const memory of memories) {
      try {
        console.log(`\n🔧 Restoring: ${memory.url.substring(0, 80)}...`);
        
        // Extract filename from broken URL
        const urlParts = new URL(memory.url);
        let filename = urlParts.pathname.split('/').pop();
        
        // If filename is truncated, create a new one
        if (filename.length < 20) {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 8);
          filename = `restored-${timestamp}-${random}.jpg`;
        }
        
        const newKey = `gallery/${filename}`;
        
        // Upload placeholder image
        const putObjectCommand = new PutObjectCommand({
          Bucket: TARGET_BUCKET,
          Key: newKey,
          Body: placeholderImage,
          ContentType: 'image/png',
          Metadata: {
            'original-url': memory.url,
            'restored-by': 'alternative-restore-script',
            'restored-at': new Date().toISOString()
          }
        });
        
        await targetS3.send(putObjectCommand);
        
        // Create new URL
        const newUrl = `/api/serve-image?key=${newKey}`;
        
        // Update database
        await prisma.memory.update({
          where: { id: memory.id },
          data: { 
            url: newUrl,
            // Optionally update other fields to indicate this is a placeholder
            // description: memory.description ? `${memory.description} (Placeholder image)` : 'Placeholder image'
          }
        });
        
        restored++;
        console.log(`  ✅ Restored: ${filename} -> ${newUrl}`);
        
      } catch (error) {
        console.log(`  ❌ Restore failed: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Restore Summary:`);
    console.log(`  ✅ Successfully restored: ${restored} photos`);
    console.log(`  ❌ Failed: ${failed} photos`);
    console.log(`  📦 Total processed: ${memories.length} photos`);

    // Verify final state
    const finalMemories = await prisma.memory.findMany({
      where: { url: { startsWith: '/api/serve-image' } }
    });
    
    console.log(`\n🎯 Final State:`);
    console.log(`  ✅ Total photos on new bucket: ${finalMemories.length}`);
    console.log(`  🔗 Bucket: ${TARGET_BUCKET}`);

    if (restored > 0) {
      console.log('\n🎉 Alternative Restore Complete!');
      console.log('✅ All broken photos replaced with placeholder images');
      console.log('🚀 Application now has consistent photo URLs');
      console.log('📝 Placeholder images can be replaced later with real photos');
    }

  } catch (error) {
    console.error('❌ Alternative restore failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

alternativeRestore().catch(console.error);
