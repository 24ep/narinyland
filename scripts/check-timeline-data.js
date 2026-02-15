import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const events = await prisma.timelineEvent.findMany();
    console.log('Timeline events in database:', events.length);
    events.forEach(e => {
      console.log(`- ID: ${e.id}, Text: ${e.text}, Date: ${e.timestamp}`);
    });
    
    // Also check interactions format
    console.log('\nChecking interaction format...');
    const formattedEvents = events.map(e => ({
      id: e.id,
      text: e.text,
      timestamp: e.timestamp,
      type: e.type,
      location: e.location,
      mediaType: e.mediaType,
      mediaUrl: e.mediaUrl,
      mediaS3Key: e.mediaS3Key,
      mediaUrls: e.mediaUrls || [],
      mediaTypes: e.mediaTypes || [],
      mediaS3Keys: e.mediaS3Keys || [],
    }));
    console.log('Formatted events:', JSON.stringify(formattedEvents, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
