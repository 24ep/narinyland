import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Fix placeholder URLs by creating local placeholders
async function fixPlaceholderUrls() {
  console.log('🔧 Fixing placeholder URLs with local images...\n');

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

    // Get memories with placeholder URLs
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          startsWith: 'https://via.placeholder.com',
          not: null,
          not: ''
        } 
      }
    });
    
    console.log(`📸 Found ${memories.length} placeholder photos to fix`);

    // Create different colored placeholder images
    const colors = [
      '4a5568', '2d3748', '1a202c', '2b6cb0', '2c5282',
      '2d3748', '4a5568', '718096', 'a0aec0', 'cbd5e0'
    ];

    let fixed = 0;
    let failed = 0;

    for (let i = 0; i < memories.length; i++) {
      const memory = memories[i];
      try {
        console.log(`\n🔧 Fixing: ${memory.url.substring(0, 60)}...`);
        
        // Create a simple SVG placeholder
        const color = colors[i % colors.length];
        const svgContent = `
          <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#${color}"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dy=".3em">
              Narinyland ${i + 1}
            </text>
          </svg>
        `.trim();
        
        const svgBuffer = Buffer.from(svgContent);
        
        // Create filename
        const filename = `placeholder-${i + 1}.svg`;
        const key = `gallery/${filename}`;
        
        // Upload to S3
        const putObjectCommand = new PutObjectCommand({
          Bucket: TARGET_BUCKET,
          Key: key,
          Body: svgBuffer,
          ContentType: 'image/svg+xml',
          Metadata: {
            'original-placeholder-url': memory.url,
            'created-by': 'fix-placeholder-urls-script',
            'created-at': new Date().toISOString()
          }
        });
        
        await targetS3.send(putObjectCommand);
        
        // Create new URL
        const newUrl = `/api/serve-image?key=${key}`;
        
        // Update database
        await prisma.memory.update({
          where: { id: memory.id },
          data: { url: newUrl }
        });
        
        fixed++;
        console.log(`  ✅ Fixed: ${filename} -> ${newUrl}`);
        
      } catch (error) {
        console.log(`  ❌ Fix failed: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Fix Summary:`);
    console.log(`  ✅ Successfully fixed: ${fixed} photos`);
    console.log(`  ❌ Failed: ${failed} photos`);
    console.log(`  📦 Total processed: ${memories.length} photos`);

    // Verify final state
    const finalMemories = await prisma.memory.findMany({
      where: { url: { startsWith: '/api/serve-image' } }
    });
    
    console.log(`\n🎯 Final State:`);
    console.log(`  ✅ Total photos on API: ${finalMemories.length}`);
    console.log(`  🔗 Bucket: ${TARGET_BUCKET}`);

    // Test a few fixed URLs
    console.log('\n🧪 Testing fixed URLs:');
    const testMemories = await prisma.memory.findMany({
      where: { url: { startsWith: '/api/serve-image' } },
      take: 3
    });
    
    for (const memory of testMemories) {
      try {
        const response = await fetch(`http://localhost:3000${memory.url}`, { method: 'HEAD' });
        console.log(`  ${memory.url.substring(0, 60)}... - ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`  ${memory.url.substring(0, 60)}... - ERROR: ${error.message}`);
      }
    }

    if (fixed > 0) {
      console.log('\n🎉 Placeholder URLs Fixed!');
      console.log('✅ All placeholder images now served locally');
      console.log('🚀 All photos should load correctly now');
    }

  } catch (error) {
    console.error('❌ Placeholder fix failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixPlaceholderUrls().catch(console.error);
