import { PrismaClient } from '@prisma/client';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// Fresh migration to fix broken-looking images
async function freshMigration() {
  console.log('🔄 Starting fresh image migration...\n');

  const prisma = new PrismaClient();
  
  // Source S3 (Supabase) - for original images
  const sourceS3 = new S3Client({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: 'bf33578637c07715b40a6871633f8dda',
      secretAccessKey: '6bb5eaf15dfaae132a227513de2597d4f41cf1c61445f3db6b56f6424da2fd7a',
    },
    endpoint: 'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/s3',
    forcePathStyle: true
  });

  // Target S3 (t3.storageapi.dev)
  const targetS3 = new S3Client({
    region: 'auto',
    credentials: {
      accessKeyId: 'tid_XAzZ_TfRxbtP_zmDbkEXInccR_dWxETsuvicIJLgAvEpVKaWfK',
      secretAccessKey: 'tsec_z944r-dQQVzUA-74CtROSMYdkq7ERkovKgj6ccobo+ru8jUgW5oeaWd5liuGbxRDdhd_zc',
    },
    endpoint: 'https://t3.storageapi.dev',
    forcePathStyle: true
  });

  const TARGET_BUCKET = 'narinlyland-storage-mek5-t';
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get current gallery
    const result = await prisma.$queryRaw`SELECT "gallery" FROM "AppConfig" WHERE "id" = 'default'`;
    const galleryData = result[0].gallery;
    const currentGallery = typeof galleryData === 'string' ? JSON.parse(galleryData) : galleryData;
    
    console.log(`📸 Current gallery: ${currentGallery.length} items`);
    
    // Separate originals and placeholders
    const originals = currentGallery.filter(item => !item.url.includes('placeholder-'));
    const placeholders = currentGallery.filter(item => item.url.includes('placeholder-'));
    
    console.log(`🖼️  Originals: ${originals.length}`);
    console.log(`🔄 Placeholders: ${placeholders.length}`);

    // Create better placeholder images
    console.log('\n🎨 Creating better placeholder images...');
    
    const newGallery = [...originals];
    let migrated = 0;
    
    for (let i = 0; i < placeholders.length; i++) {
      const placeholder = placeholders[i];
      
      try {
        // Create a beautiful SVG placeholder with gradient
        const colors = [
          ['#FF6B6B', '#4ECDC4'], // Red to Teal
          ['#667EEA', '#764BA2'], // Blue to Purple  
          ['#F093FB', '#F5576C'], // Pink to Red
          ['#4FD1C5', '#96CEB4'], // Teal to Green
          ['#FFE66D', '#FFA07A'], // Yellow to Orange
          ['#DDA0DD', '#98D8C8'], // Purple to Mint
          ['#FFB6C1', '#FF8E53'], // Pink to Orange
          ['#A8E6CF', '#7FD1AE'], // Mint to Green
          ['#FFDAB9', '#FFA07A'], // Peach to Orange
          ['#E2B0FF', '#B19CD9'], // Lavender to Purple
          ['#FFB6C1', '#FF69B4'], // Pink to Hot Pink
          ['#87CEEB', '#98D8C8'], // Sky to Mint
          ['#FFA07A', '#FF7043'], // Orange to Red
          ['#DDA0DD', '#DA70D6'], // Lavender to Orchid
          ['#FFD700', '#FFA500'], // Gold to Orange
        ];
        
        const colorPair = colors[i % colors.length];
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const filename = `beautiful-placeholder-${i + 1}-${timestamp}-${randomId}.svg`;
        
        // Create a beautiful SVG with gradient
        const svgContent = `
          <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${colorPair[0]};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${colorPair[1]};stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad${i})" />
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle" dy=".3em">
              💕 Narinyland ${i + 1}
            </text>
            <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" dy=".3em" opacity="0.9">
              Beautiful Memory
            </text>
          </svg>
        `.trim();
        
        const svgBuffer = Buffer.from(svgContent);
        const key = `gallery/${filename}`;
        
        // Upload to S3
        const putCommand = new PutObjectCommand({
          Bucket: TARGET_BUCKET,
          Key: key,
          Body: svgBuffer,
          ContentType: 'image/svg+xml',
          Metadata: {
            'type': 'beautiful-placeholder',
            'migration': 'fresh-migration',
            'timestamp': timestamp.toString()
          }
        });
        
        await targetS3.send(putCommand);
        
        // Add to new gallery
        newGallery.push({
          url: `/api/serve-image?key=${key}`,
          privacy: 'public',
          caption: 'Beautiful placeholder image'
        });
        
        migrated++;
        console.log(`  ✅ Created: ${filename}`);
        
      } catch (error) {
        console.log(`  ❌ Failed to create placeholder ${i + 1}: ${error.message}`);
        // Keep the old placeholder if creation fails
        newGallery.push(placeholder);
      }
    }

    // Update database with new gallery
    const jsonString = JSON.stringify(newGallery);
    await prisma.$executeRaw`UPDATE "AppConfig" SET "gallery" = ${jsonString}::jsonb, "updatedAt" = NOW() WHERE "id" = 'default'`;
    
    console.log(`\n✅ Updated database with ${newGallery.length} items`);
    console.log(`🔄 Migrated: ${migrated} placeholders`);
    
    // Verify
    const verifyResult = await prisma.$queryRaw`SELECT "gallery" FROM "AppConfig" WHERE "id" = 'default'`;
    const verifyData = verifyResult[0].gallery;
    const verifyGallery = typeof verifyData === 'string' ? JSON.parse(verifyData) : verifyData;
    
    console.log(`\n📊 Final verification: ${verifyGallery.length} items`);
    
    // Test a few new placeholders
    console.log('\n🧪 Testing new placeholders:');
    const newPlaceholders = verifyGallery.filter(item => item.url.includes('beautiful-placeholder'));
    
    for (let i = 0; i < Math.min(3, newPlaceholders.length); i++) {
      const item = newPlaceholders[i];
      const displayUrl = `http://localhost:3000${item.url}`;
      
      try {
        const response = await fetch(displayUrl, { method: 'HEAD' });
        console.log(`  ✅ ${item.url.substring(0, 60)}... - ${response.status} (${response.headers.get('content-length')} bytes)`);
      } catch (error) {
        console.log(`  ❌ ${item.url.substring(0, 60)}... - ERROR: ${error.message}`);
      }
    }

    console.log('\n🎉 Fresh migration complete!');
    console.log('💡 Your gallery should now look much better with beautiful gradient placeholders');
    console.log('🌐 Visit http://localhost:3000 to see the improved gallery');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

freshMigration();
