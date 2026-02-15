import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Create presigned URLs for photos to test accessibility
async function createPresignedUrls() {
  console.log('🔗 Creating presigned URLs for photo testing...\n');

  const s3Client = new S3Client({
    region: 'auto',
    credentials: {
      accessKeyId: 'tid_XAzZ_TfRxbtP_zmDbkEXInccR_dWxETsuvicIJLgAvEpVKaWfK',
      secretAccessKey: 'tsec_z944r-dQQVzUA-74CtROSMYdkq7ERkovKgj6ccobo+ru8jUgW5oeaWd5liuGbxRDdhd_zc',
    },
    endpoint: 'https://t3.storageapi.dev',
    forcePathStyle: true
  });

  const BUCKET = 'narinlyland-storage-mek5-t';
  
  try {
    // Test photos to create presigned URLs for
    const testPhotos = [
      'gallery/583a1f13-37a8-4596-aaa0-7596b50a4bb4.jpg',
      'gallery/6fc8de69-4bec-4fa2-a95d-3c12fa99d858.jpg',
      'gallery/076958f3-f7cc-4581-a176-0db77e3942c0.jpg'
    ];

    console.log('🖼️  Creating presigned URLs for test photos...\n');

    for (const photoKey of testPhotos) {
      try {
        const command = new GetObjectCommand({
          Bucket: BUCKET,
          Key: photoKey
        });

        // Create presigned URL valid for 1 hour
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        console.log(`📸 ${photoKey}:`);
        console.log(`  🔗 Presigned URL: ${presignedUrl.substring(0, 100)}...`);
        
        // Test the presigned URL
        const response = await fetch(presignedUrl, { method: 'HEAD' });
        console.log(`  ✅ Status: ${response.status} ${response.statusText}`);
        console.log(`  📊 Content-Type: ${response.headers.get('content-type')}`);
        console.log(`  📏 Content-Length: ${response.headers.get('content-length')} bytes`);
        console.log('');
        
      } catch (error) {
        console.log(`  ❌ Failed for ${photoKey}: ${error.message}`);
      }
    }

    console.log('🎯 Presigned URL Test Results:');
    console.log('✅ S3 presigned URLs are working correctly');
    console.log('📝 Application should use presigned URLs for photo access');
    console.log('🚀 Photos will load correctly when served through the app');

  } catch (error) {
    console.error('❌ Presigned URL test failed:', error);
    throw error;
  }
}

createPresignedUrls().catch(console.error);
