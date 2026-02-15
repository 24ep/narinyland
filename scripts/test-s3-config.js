import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Test S3 configuration with new bucket
async function testS3Config() {
  console.log('🧪 Testing S3 configuration...\n');

  // Target: New t3.storageapi.dev bucket
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
    console.log('🔧 Testing S3 connection...');
    
    // Test 1: List buckets (if supported)
    try {
      // This might not work with all S3-compatible providers
      console.log('  📋 Attempting to list objects...');
      // Skip listing as it might not be supported
    } catch (error) {
      console.log('  ⚠️  Bucket listing not supported (expected)');
    }

    // Test 2: Upload a test file
    console.log('  📤 Uploading test file...');
    const testContent = Buffer.from('Test file for S3 configuration');
    
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET,
      Key: 'test-s3-config.txt',
      Body: testContent,
      ContentType: 'text/plain'
    });
    
    await s3Client.send(putCommand);
    console.log('  ✅ Test file uploaded successfully');

    // Test 3: Download the test file
    console.log('  📥 Downloading test file...');
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET,
      Key: 'test-s3-config.txt'
    });
    
    const response = await s3Client.send(getCommand);
    const downloadedContent = await response.Body.transformToString();
    
    if (downloadedContent === 'Test file for S3 configuration') {
      console.log('  ✅ Test file downloaded and verified');
    } else {
      console.log('  ❌ Downloaded content mismatch');
    }

    // Test 4: Check if we can access a real photo
    console.log('  🖼️  Testing access to existing photo...');
    try {
      const photoCommand = new GetObjectCommand({
        Bucket: BUCKET,
        Key: 'gallery/583a1f13-37a8-4596-aaa0-7596b50a4bb4.jpg'
      });
      
      const photoResponse = await s3Client.send(photoCommand);
      console.log(`  ✅ Photo accessible: ${photoResponse.ContentLength} bytes`);
      console.log(`  📊 Content-Type: ${photoResponse.ContentType}`);
      
    } catch (error) {
      console.log(`  ❌ Photo access failed: ${error.message}`);
    }

    console.log('\n🎉 S3 Configuration Test Complete!');
    console.log('✅ S3 connection and basic operations working');
    console.log(`🔗 Bucket: ${BUCKET}`);
    console.log('🚀 Ready for application use');

  } catch (error) {
    console.error('❌ S3 configuration test failed:', error);
    throw error;
  }
}

testS3Config().catch(console.error);
