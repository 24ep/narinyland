// Migrate timeline images from old Supabase URLs to new API proxy URLs
import { PrismaClient } from '@prisma/client';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

async function migrateTimelineImages() {
  console.log('🔄 Migrating Timeline Images...\n');

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

    // Get all timeline events with old Supabase URLs
    console.log('1️⃣  Finding timeline events with old URLs...');
    
    const events = await prisma.timelineEvent.findMany({
      where: {
        mediaUrls: {
          isEmpty: false
        }
      }
    });
    
    console.log(`   📊 Found ${events.length} timeline events with media`);

    let migratedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const event of events) {
      console.log(`\n📸 Processing event: ${event.id}`);
      console.log(`   📝 Text: ${event.text?.substring(0, 50)}...`);
      
      if (!event.mediaUrls || event.mediaUrls.length === 0) {
        console.log('   ⚠️  No media URLs found');
        skippedCount++;
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
              migratedCount++;
              
            } catch (error) {
              console.log(`   ❌ File not found in new S3: ${s3Key}`);
              console.log(`   🔍 Attempting to download from old Supabase...`);
              
              try {
                // Try to download from old Supabase
                const response = await fetch(oldUrl);
                
                if (response.ok) {
                  const buffer = Buffer.from(await response.arrayBuffer());
                  console.log(`   ✅ Downloaded ${buffer.length} bytes from old Supabase`);
                  
                  // Upload to new S3
                  const putCommand = new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: s3Key,
                    Body: buffer,
                    ContentType: 'image/jpeg'
                  });
                  
                  await s3Client.send(putCommand);
                  console.log(`   ✅ Uploaded to new S3: ${s3Key}`);
                  
                  // Update to new API proxy URL
                  const newUrl = `/api/serve-image?key=${s3Key}`;
                  newMediaUrls.push(newUrl);
                  newS3Keys.push(s3Key);
                  
                  console.log(`   ✅ Updated to: ${newUrl}`);
                  migratedCount++;
                  
                } else {
                  console.log(`   ❌ Failed to download from old Supabase: ${response.status}`);
                  failedCount++;
                }
                
              } catch (downloadError) {
                console.log(`   ❌ Download failed: ${downloadError.message}`);
                failedCount++;
              }
            }
            
          } else {
            console.log('   ⚠️  No S3 key found, skipping');
            failedCount++;
          }
          
        } else if (oldUrl.startsWith('/api/serve-image')) {
          console.log('   ✅ Already using new API proxy URL');
          newMediaUrls.push(oldUrl);
          if (s3Key) newS3Keys.push(s3Key);
          skippedCount++;
          
        } else {
          console.log(`   ⚠️  Unknown URL format: ${oldUrl}`);
          failedCount++;
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

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migratedCount}`);
    console.log(`   ⚠️  Skipped (already migrated): ${skippedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   📊 Total processed: ${events.length}`);

    // Test a few migrated images
    console.log('\n2️⃣  Testing migrated images:');
    
    const testEvents = await prisma.timelineEvent.findMany({
      where: {
        mediaUrls: {
          not: null
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
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateTimelineImages();
