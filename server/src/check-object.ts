import 'dotenv/config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ap-northeast-1',
  endpoint: process.env.S3_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

async function checkObject() {
  try {
    const key = 'timeline/013e5594-862d-405e-a2e8-0c7113b3a672';
    const bucket = process.env.S3_BUCKET || 'narinyland';
    
    console.log(`Checking object: ${key} in bucket: ${bucket}`);
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    console.log('Successfully read object with S3 Client.');
    console.log('MimeType:', response.ContentType);
    console.log('ContentLength:', response.ContentLength);
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
        console.error('Object does not exist.');
    } else {
        console.error('Error reading object:', error.message);
    }
  }
}

checkObject();
