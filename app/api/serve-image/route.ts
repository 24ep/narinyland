import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT!,
  forcePathStyle: true
});

const BUCKET = process.env.S3_BUCKET!;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  
  console.log('Serve-image API called with key:', key);
  
  if (!key) {
    return new Response('Missing key parameter', { status: 400 });
  }
  
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key
    });
    
    const response = await s3Client.send(command);
    
    const headers = new Headers();
    headers.set('Content-Type', response.ContentType || 'application/octet-stream');
    headers.set('Content-Length', response.ContentLength?.toString() || '0');
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    
    return new Response(response.Body as ReadableStream, { headers });
  } catch (error) {
    console.error('Serve-image error:', error);
    return new Response(`Image not found: ${key}`, { status: 404 });
  }
}
