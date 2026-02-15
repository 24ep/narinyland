import { PrismaClient } from '@prisma/client';

// Check timeline database directly
async function checkTimelineDatabase() {
  console.log('🔍 Checking Timeline Database Directly...\n');

  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check if the specific timeline item exists
    const testId = '1d98db6e-9da8-4988-99a1-ebd20e4890cf';
    
    console.log(`1️⃣  Checking timeline item: ${testId}`);
    
    try {
      const event = await prisma.timelineEvent.findUnique({
        where: { id: testId }
      });
      
      if (event) {
        console.log('   ✅ Timeline item found in database');
        console.log(`   📝 Text: ${event.text}`);
        console.log(`   🎭 Type: ${event.type}`);
        console.log(`   📍 Location: ${event.location}`);
        console.log(`   📅 Timestamp: ${event.timestamp}`);
        console.log(`   📸 Media URLs: ${event.mediaUrls?.length || 0}`);
        console.log(`   📸 Media S3 Keys: ${event.mediaS3Keys?.length || 0}`);
      } else {
        console.log('   ❌ Timeline item NOT found in database');
      }
    } catch (error) {
      console.log(`   ❌ Database error: ${error.message}`);
    }

    // Check all timeline items
    console.log('\n2️⃣  Checking all timeline items:');
    
    try {
      const allEvents = await prisma.timelineEvent.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`   📊 Total timeline items: ${allEvents.length}`);
      
      if (allEvents.length > 0) {
        console.log('   📸 Sample timeline items:');
        allEvents.forEach((event, index) => {
          console.log(`     ${index + 1}. ${event.id} - ${event.text?.substring(0, 50)}...`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error getting timeline items: ${error.message}`);
    }

    // Try to create the missing timeline item to test
    console.log('\n3️⃣  Testing timeline item creation:');
    
    try {
      const newEvent = await prisma.timelineEvent.create({
        data: {
          id: testId,
          text: 'Test timeline item',
          type: 'pet',
          location: 'Test location',
          timestamp: new Date('2024-02-15T10:00:00Z'),
          configId: 'default'
        }
      });
      
      console.log('   ✅ Created timeline item successfully');
      console.log(`   📝 ID: ${newEvent.id}`);
      console.log(`   📝 Text: ${newEvent.text}`);
      
      // Clean up the test item
      await prisma.timelineEvent.delete({
        where: { id: testId }
      });
      console.log('   🗑️  Cleaned up test item');
      
    } catch (error) {
      console.log(`   ❌ Error creating timeline item: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimelineDatabase();
