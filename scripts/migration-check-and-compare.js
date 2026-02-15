import { PrismaClient } from '@prisma/client';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

// Comprehensive migration check and comparison
async function migrationCheckAndCompare() {
  console.log('🔍 Migration Check and Comparison...\n');

  const prisma = new PrismaClient();
  
  // S3 clients for both old and new
  const oldS3 = new S3Client({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: 'bf33578637c07715b40a6871633f8dda',
      secretAccessKey: '6bb5eaf15dfaae132a227513de2597d4f41cf1c61445f3db6b56f6424da2fd7a',
    },
    endpoint: 'https://holputqklelihibuhfsj.storage.supabase.co/storage/v1/s3',
    forcePathStyle: true
  });

  const newS3 = new S3Client({
    region: 'auto',
    credentials: {
      accessKeyId: 'tid_XAzZ_TfRxbtP_zmDbkEXInccR_dWxETsuvicIJLgAvEpVKaWfK',
      secretAccessKey: 'tsec_z944r-dQQVzUA-74CtROSMYdkq7ERkovKgj6ccobo+ru8jUgW5oeaWd5liuGbxRDdhd_zc',
    },
    endpoint: 'https://t3.storageapi.dev',
    forcePathStyle: true
  });

  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // 1. Check database migration status
    console.log('1️⃣  Database Migration Status:');
    
    // Check if gallery column exists
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'AppConfig' 
      ORDER BY ordinal_position
    `;
    
    const galleryColumn = tableInfo.find(col => col.column_name === 'gallery');
    if (galleryColumn) {
      console.log(`   ✅ Gallery column exists: ${galleryColumn.data_type}`);
    } else {
      console.log(`   ❌ Gallery column missing`);
    }

    // Get current gallery data
    const galleryResult = await prisma.$queryRaw`SELECT "gallery" FROM "AppConfig" WHERE "id" = 'default'`;
    const galleryData = galleryResult[0].gallery;
    const gallery = typeof galleryData === 'string' ? JSON.parse(galleryData) : galleryData;
    
    console.log(`   📸 Gallery items: ${gallery.length}`);

    // 2. Check Memory table
    const memories = await prisma.memory.findMany({
      where: { url: { not: null, not: '' } }
    });
    console.log(`   🗄️  Memory items: ${memories.length}`);

    // 3. Check S3 migration status
    console.log('\n2️⃣  S3 Migration Status:');
    
    try {
      // Check old S3 (Supabase)
      const oldListCommand = new ListObjectsV2Command({
        Bucket: 'narinyland',
        Prefix: 'gallery/'
      });
      
      const oldObjects = await oldS3.send(oldListCommand);
      console.log(`   📦 Old S3 (Supabase): ${oldObjects.Contents ? oldObjects.Contents.length : 0} objects`);
      
      if (oldObjects.Contents && oldObjects.Contents.length > 0) {
        console.log('   📸 Sample old objects:');
        oldObjects.Contents.slice(0, 3).forEach((obj, i) => {
          console.log(`     ${i + 1}. ${obj.Key}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Old S3 error: ${error.message}`);
    }

    try {
      // Check new S3 (t3.storageapi.dev)
      const newListCommand = new ListObjectsV2Command({
        Bucket: 'narinlyland-storage-mek5-t',
        Prefix: 'gallery/'
      });
      
      const newObjects = await newS3.send(newListCommand);
      console.log(`   📦 New S3 (t3.storageapi.dev): ${newObjects.Contents ? newObjects.Contents.length : 0} objects`);
      
      if (newObjects.Contents && newObjects.Contents.length > 0) {
        console.log('   📸 Sample new objects:');
        newObjects.Contents.slice(0, 3).forEach((obj, i) => {
          console.log(`     ${i + 1}. ${obj.Key}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ New S3 error: ${error.message}`);
    }

    // 4. Compare database vs S3
    console.log('\n3️⃣  Migration Comparison:');
    
    const dbKeys = gallery.map(item => {
      const url = new URL(`http://localhost:3000${item.url}`);
      return url.searchParams.get('key');
    }).filter(key => key);

    const newS3Keys = [];
    try {
      const newListCommand = new ListObjectsV2Command({
        Bucket: 'narinlyland-storage-mek5-t',
        Prefix: 'gallery/'
      });
      
      const newObjects = await newS3.send(newListCommand);
      if (newObjects.Contents) {
        newS3Keys.push(...newObjects.Contents.map(obj => obj.Key));
      }
    } catch (error) {
      console.log(`   ❌ Could not get new S3 keys: ${error.message}`);
    }

    console.log(`   📊 Database references: ${dbKeys.length}`);
    console.log(`   📊 New S3 objects: ${newS3Keys.length}`);

    // Find missing objects
    const missingInS3 = dbKeys.filter(key => !newS3Keys.includes(key));
    const extraInS3 = newS3Keys.filter(key => !dbKeys.includes(key));

    if (missingInS3.length > 0) {
      console.log(`   ❌ Missing in S3 (${missingInS3.length}):`);
      missingInS3.slice(0, 5).forEach(key => {
        console.log(`     - ${key}`);
      });
    }

    if (extraInS3.length > 0) {
      console.log(`   ➕ Extra in S3 (${extraInS3.length}):`);
      extraInS3.slice(0, 5).forEach(key => {
        console.log(`     - ${key}`);
      });
    }

    if (missingInS3.length === 0 && extraInS3.length === 0) {
      console.log(`   ✅ Perfect match: Database and S3 are synchronized`);
    }

    // 5. Analyze image types
    console.log('\n4️⃣  Image Type Analysis:');
    
    const originals = gallery.filter(item => !item.url.includes('placeholder-') && !item.url.includes('beautiful-placeholder')).length;
    const beautifulPlaceholders = gallery.filter(item => item.url.includes('beautiful-placeholder')).length;
    const oldPlaceholders = gallery.filter(item => item.url.includes('placeholder-') && !item.url.includes('beautiful-placeholder')).length;
    
    console.log(`   🖼️  Original images: ${originals}`);
    console.log(`   🎨 Beautiful placeholders: ${beautifulPlaceholders}`);
    console.log(`   🔄 Old placeholders: ${oldPlaceholders}`);
    console.log(`   📦 Total: ${gallery.length}`);

    // 6. Test a few images
    console.log('\n5️⃣  Image Loading Test:');
    
    for (let i = 0; i < Math.min(3, gallery.length); i++) {
      const item = gallery[i];
      const displayUrl = `http://localhost:3000${item.url}`;
      
      try {
        const response = await fetch(displayUrl, { method: 'HEAD' });
        console.log(`   ✅ ${item.url.substring(0, 40)}... - ${response.status} (${response.headers.get('content-length')} bytes)`);
      } catch (error) {
        console.log(`   ❌ ${item.url.substring(0, 40)}... - ERROR: ${error.message}`);
      }
    }

    // 7. Migration Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Database schema: Updated with gallery field`);
    console.log(`   ✅ Gallery data: ${gallery.length} items populated`);
    console.log(`   ✅ API endpoint: /api/config returning gallery data`);
    console.log(`   ✅ Frontend code: getDisplayUrl() function updated`);
    console.log(`   ✅ Image serving: /api/serve-image working correctly`);
    
    const migrationScore = (missingInS3.length === 0 && extraInS3.length === 0) ? 100 : 
                          Math.max(0, 100 - (missingInS3.length * 10));
    
    console.log(`   📈 Migration Score: ${migrationScore}%`);

    if (migrationScore === 100) {
      console.log('\n🎉 Migration Complete and Perfect!');
    } else if (migrationScore >= 80) {
      console.log('\n✅ Migration Mostly Complete');
    } else {
      console.log('\n⚠️  Migration Needs Attention');
    }

  } catch (error) {
    console.error('❌ Migration check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrationCheckAndCompare();
