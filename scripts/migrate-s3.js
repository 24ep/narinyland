import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Source: Supabase S3
const sourceS3 = new S3Client({
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: 'bf33578637c07715b40a6871633f8dda',
    secretAccessKey: '6bb5eaf15dfaae132a227513de2597d4f41cf1c61445f3db6b56f6424da2fd7a',
  },
  endpoint: 'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/s3',
  forcePathStyle: 'virtual'
});

// Target: t3.storageapi.dev
const targetS3 = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: 'tid_dZVznlirLettMmvYPFhOFebQsLAsShgSfVrkrNLiWZcznwGHAK',
    secretAccessKey: 'tsec_1-RbxBo4SH0Kpu0os0mKIqJHe9uWqXissEb9X2hcIK9Y44P5GIkwZY2HiYxzKoQuTN5VvU',
  },
  endpoint: 'https://t3.storageapi.dev',
  forcePathStyle: 'virtual'
});

const BUCKET_NAME = 'convenient-crate-fpoysecg';

async function migrateS3Data() {
  console.log('🚀 Starting S3 migration from Supabase to t3.storageapi.dev...\n');

  try {
    // Test connections
    console.log('📡 Testing S3 connections...');
    
    // Test source connection
    try {
      await sourceS3.listBuckets({});
      console.log('✅ Source S3 (Supabase) connected');
    } catch (error) {
      console.log('⚠️  Source S3 connection issue:', error.message);
    }
    
    // Test target connection
    try {
      await targetS3.listBuckets({});
      console.log('✅ Target S3 (t3.storageapi.dev) connected');
    } catch (error) {
      console.log('⚠️  Target S3 connection issue:', error.message);
    }

    // List objects in source bucket
    console.log('\n📋 Listing objects in source bucket...');
    const sourceObjects = await sourceS3.send(new ListObjectsV2Command({
      Bucket: 'narinyland',
      MaxKeys: 1000
    }));
    
    const objects = sourceObjects.Contents || [];
    console.log(`📦 Found ${objects.length} objects to migrate`);

    if (objects.length === 0) {
      console.log('ℹ️  No objects found in source bucket');
      return;
    }

    // Migrate objects
    console.log('\n📤 Migrating objects to t3.storageapi.dev...');
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const object of objects) {
      try {
        // Get object from source
        const getObjectParams = {
          Bucket: 'narinyland',
          Key: object.Key
        };
        
        const sourceObject = await sourceS3.send(new GetObjectCommand(getObjectParams));
        
        // Upload to target
        const putParams = {
          Bucket: BUCKET_NAME,
          Key: object.Key,
          Body: sourceObject.Body,
          ContentType: sourceObject.ContentType || 'application/octet-stream',
          Metadata: sourceObject.Metadata || {}
        };
        
        await targetS3.send(new PutObjectCommand(putParams));
        
        migrated++;
        console.log(`  ✅ Migrated: ${object.Key} (${(sourceObject.ContentLength || 0).toLocaleString()} bytes)`);
        
      } catch (error) {
        errors++;
        console.log(`  ❌ Failed to migrate ${object.Key}: ${error.message}`);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Successfully migrated: ${migrated} objects`);
    console.log(`  ⚠️  Skipped: ${skipped} objects`);
    console.log(`  ❌ Errors: ${errors} objects`);
    console.log(`  📦 Total objects: ${objects.length}`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    
    const targetObjects = await targetS3.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1000
    }));
    
    const targetCount = targetObjects.Contents?.length || 0;
    
    console.log(`✅ Verification: ${targetCount} objects found in target bucket`);
    
    if (targetCount === migrated) {
      console.log('\n🎉 S3 Migration Completed Successfully!');
      console.log(`✅ All ${migrated} objects migrated to t3.storageapi.dev`);
      console.log(`🔗 Bucket: ${BUCKET_NAME}`);
      console.log('🚀 Your S3 data is now on the new provider!');
    } else {
      console.log(`\n⚠️  Migration incomplete: ${migrated}/${targetCount} objects migrated`);
    }

  } catch (error) {
    console.error('❌ S3 migration failed:', error);
    throw error;
  }
}

migrateS3Data().catch(console.error);
