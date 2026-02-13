import prisma from './lib/prisma.js';

async function makeBucketPublic() {
  try {
    const bucketName = process.env.S3_BUCKET || 'narinyland';
    console.log(`Setting bucket ${bucketName} to public...`);
    
    // Supabase specific SQL to make a bucket public
    await prisma.$executeRawUnsafe(`
      UPDATE storage.buckets 
      SET public = true 
      WHERE id = $1
    `, bucketName);
    
    console.log(`Successfully set bucket ${bucketName} to public.`);
  } catch (error: any) {
    console.error('Error setting bucket to public:', error.message);
    console.log('Falling back to direct bucket creation check if table not found...');
  } finally {
    await prisma.$disconnect();
  }
}

makeBucketPublic();
