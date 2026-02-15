// Simple fix for timeline images - update URLs to API proxy format and create placeholders
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async function fixTimelineImagesSimple() {
  console.log('🔧 Simple Timeline Image Fix...\n');

  const prisma = new PrismaClient();
  
  // S3 client for new storage
  const s3Client = new S3Client({
    region: 'auto',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    endpoint: process.env.S3_ENDPOINT || '',
    forcePathStyle: true
  });

  const BUCKET = process.env.S3_BUCKET || 'narinyland';
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all timeline events with media
    console.log('1️⃣  Getting all timeline events with media...');
    
    const events = await prisma.timelineEvent.findMany({
      where: {
        mediaUrls: {
          isEmpty: false
        }
      }
    });
    
    console.log(`   📊 Found ${events.length} timeline events with media`);

    let fixedCount = 0;
    let createdCount = 0;

    for (const event of events) {
      console.log(`\n📸 Processing event: ${event.id}`);
      console.log(`   📝 Text: ${event.text?.substring(0, 50)}...`);
      
      if (!event.mediaUrls || event.mediaUrls.length === 0) {
        console.log('   ⚠️  No media URLs found');
        continue;
      }

      const newMediaUrls = [];
      const newS3Keys = [];
      
      for (let i = 0; i < event.mediaUrls.length; i++) {
        const oldUrl = event.mediaUrls[i];
        const s3Key = event.mediaS3Keys?.[i];
        
        console.log(`   🔄 Processing URL ${i + 1}: ${oldUrl.substring(0, 50)}...`);
        
        // Check if it's an old Supabase URL
        if (oldUrl.startsWith('https://holputqklelihibuhfsj.storage.supabase.co')) {
          console.log('   🔍 Detected old Supabase URL');
          
          if (s3Key) {
            // Check if file exists in new S3
            try {
              console.log(`   🔍 Checking if file exists in new S3: ${s3Key}`);
              
              const { GetObjectCommand } = await import('@aws-sdk/client-s3');
              const getCommand = new GetObjectCommand({
                Bucket: BUCKET,
                Key: s3Key
              });
              
              await s3Client.send(getCommand);
              console.log('   ✅ File exists in new S3');
              
              // Update to new API proxy URL
              const newUrl = `/api/serve-image?key=${s3Key}`;
              newMediaUrls.push(newUrl);
              newS3Keys.push(s3Key);
              
              console.log(`   ✅ Updated to: ${newUrl}`);
              fixedCount++;
              
            } catch (error) {
              console.log(`   ❌ File not found in new S3: ${s3Key}`);
              console.log(`   🎨 Creating placeholder image...`);
              
              // Create a placeholder image
              const placeholderKey = `timeline/placeholder-${event.id}-${i}.png`;
              const placeholderSvg = `
                <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad${event.id}${i}" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
                      <stop offset="50%" style="stop-color:#4ecdc4;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#45b7d1;stop-opacity:1" />
                    </linearGradient>
                  </defs>
                  <rect width="400" height="300" fill="url(#grad${event.id}${i})" />
                  <text x="200" y="150" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">
                    Timeline Memory
                  </text>
                  <text x="200" y="170" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">
                    ${event.text?.substring(0, 30) || 'Memory'}...
                  </text>
                </svg>
              `;
              
              const buffer = Buffer.from(placeholderSvg);
              
              const putCommand = new PutObjectCommand({
                Bucket: BUCKET,
                Key: placeholderKey,
                Body: buffer,
                ContentType: 'image/svg+xml'
              });
              
              await s3Client.send(putCommand);
              console.log(`   ✅ Created placeholder: ${placeholderKey}`);
              
              // Update to new API proxy URL
              const newUrl = `/api/serve-image?key=${placeholderKey}`;
              newMediaUrls.push(newUrl);
              newS3Keys.push(placeholderKey);
              
              console.log(`   ✅ Updated to: ${newUrl}`);
              createdCount++;
            }
            
          } else {
            console.log('   ⚠️  No S3 key found, creating placeholder...');
            
            // Create a placeholder image
            const placeholderKey = `timeline/placeholder-${event.id}-${i}.png`;
            const placeholderSvg = `
              <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="grad${event.id}${i}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#4ecdc4;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#45b7d1;stop-opacity:1" />
                  </linearGradient>
                </defs>
                <rect width="400" height="300" fill="url(#grad${event.id}${i})" />
                <text x="200" y="150" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">
                  Timeline Memory
                </text>
                <text x="200" y="170" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">
                  ${event.text?.substring(0, 30) || 'Memory'}...
                </text>
              </svg>
            `;
            
            const buffer = Buffer.from(placeholderSvg);
            
            const putCommand = new PutObjectCommand({
              Bucket: BUCKET,
              Key: placeholderKey,
              Body: buffer,
              ContentType: 'image/svg+xml'
            });
            
            await s3Client.send(putCommand);
            console.log(`   ✅ Created placeholder: ${placeholderKey}`);
            
            // Update to new API proxy URL
            const newUrl = `/api/serve-image?key=${placeholderKey}`;
            newMediaUrls.push(newUrl);
            newS3Keys.push(placeholderKey);
            
            console.log(`   ✅ Updated to: ${newUrl}`);
            createdCount++;
          }
          
        } else if (oldUrl.startsWith('/api/serve-image')) {
          console.log('   ✅ Already using new API proxy URL');
          newMediaUrls.push(oldUrl);
          if (s3Key) newS3Keys.push(s3Key);
          
        } else {
          console.log(`   ⚠️  Unknown URL format, creating placeholder...`);
          
          // Create a placeholder image
          const placeholderKey = `timeline/placeholder-${event.id}-${i}.png`;
          const placeholderSvg = `
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad${event.id}${i}" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#4ecdc4;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#45b7d1;stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect width="400" height="300" fill="url(#grad${event.id}${i})" />
              <text x="200" y="150" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">
                Timeline Memory
              </text>
              <text x="200" y="170" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">
                ${event.text?.substring(0, 30) || 'Memory'}...
              </text>
            </svg>
          `;
          
          const buffer = Buffer.from(placeholderSvg);
          
          const putCommand = new PutObjectCommand({
            Bucket: BUCKET,
            Key: placeholderKey,
            Body: buffer,
            ContentType: 'image/svg+xml'
          });
          
          await s3Client.send(putCommand);
          console.log(`   ✅ Created placeholder: ${placeholderKey}`);
          
          // Update to new API proxy URL
          const newUrl = `/api/serve-image?key=${placeholderKey}`;
          newMediaUrls.push(newUrl);
          newS3Keys.push(placeholderKey);
          
          console.log(`   ✅ Updated to: ${newUrl}`);
          createdCount++;
        }
      }
      
      // Update the database if we have changes
      if (newMediaUrls.length > 0 && (newMediaUrls.length !== event.mediaUrls?.length || 
          newMediaUrls.some((url, i) => url !== event.mediaUrls?.[i]))) {
        
        console.log('   💾 Updating database...');
        
        await prisma.timelineEvent.update({
          where: { id: event.id },
          data: {
            mediaUrls: newMediaUrls,
            mediaS3Keys: newS3Keys
          }
        });
        
        console.log('   ✅ Database updated');
      }
    }

    console.log('\n📊 Fix Summary:');
    console.log(`   ✅ Fixed existing URLs: ${fixedCount}`);
    console.log(`   🎨 Created placeholders: ${createdCount}`);
    console.log(`   📊 Total processed: ${events.length}`);

    // Test a few fixed images
    console.log('\n2️⃣  Testing fixed images:');
    
    const testEvents = await prisma.timelineEvent.findMany({
      where: {
        mediaUrls: {
          isEmpty: false
        }
      },
      take: 3
    });
    
    for (const event of testEvents) {
      if (event.mediaUrls && event.mediaUrls.length > 0) {
        const testUrl = event.mediaUrls[0];
        const fullUrl = testUrl.startsWith('/api/') ? `http://localhost:3000${testUrl}` : testUrl;
        
        console.log(`   🧪 Testing: ${testUrl.substring(0, 50)}...`);
        
        try {
          const response = await fetch(fullUrl, { method: 'HEAD' });
          console.log(`      📊 Status: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            const size = response.headers.get('content-length');
            console.log(`      ✅ Success! Type: ${contentType}, Size: ${size} bytes`);
          } else {
            console.log(`      ❌ Failed: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.log(`      ❌ Error: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTimelineImagesSimple();
