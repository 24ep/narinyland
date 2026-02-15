import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Debug S3 URL construction and access
async function debugS3Urls() {
  console.log('🔍 Debugging S3 URL construction...\n');

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
    const photoKey = 'gallery/583a1f13-37a8-4596-aaa0-7596b50a4bb4.jpg';
    
    console.log('🔧 Testing different URL formats...\n');
    
    // Test 1: Standard presigned URL
    console.log('1️⃣  Standard presigned URL:');
    const command1 = new GetObjectCommand({
      Bucket: BUCKET,
      Key: photoKey
    });
    
    const presignedUrl1 = await getSignedUrl(s3Client, command1, { expiresIn: 3600 });
    console.log(`   🔗 ${presignedUrl1}`);
    
    const response1 = await fetch(presignedUrl1, { method: 'HEAD' });
    console.log(`   📊 Status: ${response1.status} ${response1.statusText}`);
    
    // Test 2: Try without forcePathStyle
    console.log('\n2️⃣  Without forcePathStyle:');
    const s3Client2 = new S3Client({
      region: 'auto',
      credentials: {
        accessKeyId: 'tid_XAzZ_TfRxbtP_zmDbkEXInccR_dWxETsuvicIJLgAvEpVKaWfK',
        secretAccessKey: 'tsec_z944r-dQQVzUA-74CtROSMYdkq7ERkovKgj6ccobo+ru8jUgW5oeaWd5liuGbxRDdhd_zc',
      },
      endpoint: 'https://t3.storageapi.dev',
      forcePathStyle: false
    });
    
    const command2 = new GetObjectCommand({
      Bucket: BUCKET,
      Key: photoKey
    });
    
    const presignedUrl2 = await getSignedUrl(s3Client2, command2, { expiresIn: 3600 });
    console.log(`   🔗 ${presignedUrl2}`);
    
    const response2 = await fetch(presignedUrl2, { method: 'HEAD' });
    console.log(`   📊 Status: ${response2.status} ${response2.statusText}`);
    
    // Test 3: Try different endpoint format
    console.log('\n3️⃣  Alternative endpoint format:');
    const s3Client3 = new S3Client({
      region: 'auto',
      credentials: {
        accessKeyId: 'tid_XAzZ_TfRxbtP_zmDbkEXInccR_dWxETsuvicIJLgAvEpVKaWfK',
        secretAccessKey: 'tsec_z944r-dQQVzUA-74CtROSMYdkq7ERkovKgj6ccobo+ru8jUgW5oeaWd5liuGbxRDdhd_zc',
      },
      endpoint: 'https://t3.storageapi.dev',
      forcePathStyle: true,
      signatureVersion: 'v4'
    });
    
    const command3 = new GetObjectCommand({
      Bucket: BUCKET,
      Key: photoKey
    });
    
    const presignedUrl3 = await getSignedUrl(s3Client3, command3, { expiresIn: 3600 });
    console.log(`   🔗 ${presignedUrl3}`);
    
    const response3 = await fetch(presignedUrl3, { method: 'HEAD' });
    console.log(`   📊 Status: ${response3.status} ${response3.statusText}`);
    
    // Test 4: Verify the object exists
    console.log('\n4️⃣  Verify object exists via S3 SDK:');
    const command4 = new GetObjectCommand({
      Bucket: BUCKET,
      Key: photoKey
    });
    
    try {
      const response4 = await s3Client.send(command4);
      console.log(`   ✅ Object exists: ${response4.ContentLength} bytes`);
      console.log(`   📊 Content-Type: ${response4.ContentType}`);
    } catch (error) {
      console.log(`   ❌ Object access failed: ${error.message}`);
    }

    console.log('\n🎯 Debug Results:');
    console.log('📝 S3 SDK can access objects, but HTTP URLs fail');
    console.log('🔧 This suggests the application needs to use S3 SDK for photo serving');
    console.log('🚀 Direct URL access may not be supported by this provider');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    throw error;
  }
}

debugS3Urls().catch(console.error);
