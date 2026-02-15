import { PrismaClient } from '@prisma/client';

// Debug the photo API route
async function debugPhotoApi() {
  console.log('🔍 Debugging photo API route...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get some photo URLs to test
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          startsWith: '/api/photos/',
          not: null,
          not: ''
        } 
      },
      take: 5
    });
    
    console.log(`📸 Found ${memories.length} photos with proxy URLs:\n`);

    for (const memory of memories) {
      console.log(`🔗 URL: ${memory.url}`);
      
      // Extract the key part
      const key = memory.url.replace('/api/photos/', '');
      console.log(`🔑 Key: ${key}`);
      
      // Test if the key exists in S3
      try {
        const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
        
        const s3Client = new S3Client({
          region: 'auto',
          credentials: {
            accessKeyId: 'tid_XAzZ_TfRxbtP_zmDbkEXInccR_dWxETsuvicIJLgAvEpVKaWfK',
            secretAccessKey: 'tsec_z944r-dQQVzUA-74CtROSMYdkq7ERkovKgj6ccobo+ru8jUgW5oeaWd5liuGbxRDdhd_zc',
          },
          endpoint: 'https://t3.storageapi.dev',
          forcePathStyle: true
        });

        const command = new GetObjectCommand({
          Bucket: 'narinlyland-storage-mek5-t',
          Key: key
        });
        
        const response = await s3Client.send(command);
        console.log(`  ✅ S3 Access: ${response.ContentLength} bytes`);
        console.log(`  📊 Content-Type: ${response.ContentType}`);
        
      } catch (error) {
        console.log(`  ❌ S3 Access Failed: ${error.message}`);
      }
      
      console.log('');
    }

    // Check environment variables
    console.log('🔧 Environment Variables Check:');
    console.log(`  🪣 S3_BUCKET: ${process.env.S3_BUCKET}`);
    console.log(`  🔗 S3_ENDPOINT: ${process.env.S3_ENDPOINT}`);
    console.log(`  🌍 S3_REGION: ${process.env.S3_REGION}`);
    console.log(`  🔑 S3_ACCESS_KEY_ID: ${process.env.S3_ACCESS_KEY_ID ? 'Set' : 'Not set'}`);
    console.log(`  🔐 S3_SECRET_ACCESS_KEY: ${process.env.S3_SECRET_ACCESS_KEY ? 'Set' : 'Not set'}`);

    console.log('\n🎯 Debug Results:');
    console.log('📝 If S3 access works but API returns 404, check:');
    console.log('  1. Next.js development server is running');
    console.log('  2. Environment variables are loaded in the API route');
    console.log('  3. API route file is in correct location');
    console.log('  4. No syntax errors in the API route');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

debugPhotoApi().catch(console.error);
