import { PrismaClient } from '@prisma/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Create a photo proxy solution for serving images
async function createPhotoProxy() {
  console.log('🖼️  Creating photo proxy solution...\n');

  const prisma = new PrismaClient();
  
  // S3 client for the new bucket
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
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all photos
    const memories = await prisma.memory.findMany({
      where: { 
        url: { 
          contains: 't3.storageapi.dev',
          not: null,
          not: ''
        } 
      },
      take: 5
    });
    
    console.log(`📸 Creating proxy for ${memories.length} photos...\n`);

    // Create a simple API route for photo serving
    const apiRouteContent = `
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

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

export async function GET(request, { params }) {
  const { key } = params;
  
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key
    });
    
    const response = await s3Client.send(command);
    
    const headers = new Headers();
    headers.set('Content-Type', response.ContentType || 'application/octet-stream');
    headers.set('Content-Length', response.ContentLength.toString());
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    
    return new Response(response.Body, { headers });
  } catch (error) {
    console.error('Photo proxy error:', error);
    return new Response('Photo not found', { status: 404 });
  }
}
`;

    console.log('📝 API Route Content:');
    console.log(apiRouteContent);
    
    // Test photo access via S3 SDK
    for (const memory of memories) {
      try {
        const urlParts = new URL(memory.url);
        const photoKey = urlParts.pathname.replace(`/${BUCKET}/`, '');
        
        console.log(`\n🧪 Testing: ${photoKey}`);
        
        const command = new GetObjectCommand({
          Bucket: BUCKET,
          Key: photoKey
        });
        
        const response = await s3Client.send(command);
        console.log(`  ✅ Accessible: ${response.ContentLength} bytes`);
        console.log(`  📊 Type: ${response.ContentType}`);
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    console.log('\n🎯 Photo Proxy Solution:');
    console.log('📝 Create API route: /api/photos/[key]');
    console.log('🔧 Update photo URLs to use proxy: /api/photos/gallery/filename.jpg');
    console.log('🚀 Photos will be served through S3 SDK, not direct URLs');

  } catch (error) {
    console.error('❌ Photo proxy creation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createPhotoProxy().catch(console.error);
