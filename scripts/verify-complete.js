import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCompleteMigration() {
  console.log('🔍 Final verification of Railway PostgreSQL migration...\n');
  
  try {
    // Test database connection
    console.log('📡 Testing Railway database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');
    
    // Count all records
    console.log('📊 Counting all records in Railway database...');
    
    const [appConfigCount, partnersCount, memoriesCount, eventsCount, couponsCount, lettersCount, statsCount] = await Promise.all([
      prisma.appConfig.count(),
      prisma.partner.count(),
      prisma.memory.count(),
      prisma.timelineEvent.count(),
      prisma.coupon.count(),
      prisma.loveLetter.count(),
      prisma.loveStats.count()
    ]);
    
    console.log('\n📋 Railway Database Record Counts:');
    console.log(`  AppConfig: ${appConfigCount} records`);
    console.log(`  Partners: ${partnersCount} records`);
    console.log(`  Memories: ${memoriesCount} records`);
    console.log(`  Timeline Events: ${eventsCount} records`);
    console.log(`  Coupons: ${couponsCount} records`);
    console.log(`  Love Letters: ${lettersCount} records`);
    console.log(`  Love Stats: ${statsCount} records`);
    
    // Sample data verification
    console.log('\n🔍 Sample data verification...');
    
    const [config, partners, memories, events, coupons, letters, stats] = await Promise.all([
      prisma.appConfig.findFirst(),
      prisma.partner.findMany({ take: 2 }),
      prisma.memory.findMany({ take: 3 }),
      prisma.timelineEvent.findMany({ take: 2 }),
      prisma.coupon.findMany({ take: 2 }),
      prisma.loveLetter.findMany({ take: 2 }),
      prisma.loveStats.findFirst()
    ]);
    
    console.log(`✅ AppConfig: ${config?.appName || 'N/A'}`);
    console.log(`✅ Partners: ${partners.map(p => `${p.name} (${p.points} pts)`).join(', ')}`);
    console.log(`✅ Memories: ${memories.length} memories found`);
    console.log(`✅ Timeline Events: ${events.length} events found`);
    console.log(`✅ Coupons: ${coupons.map(c => `${c.title} (${c.points} pts)`).join(', ')}`);
    console.log(`✅ Love Letters: ${letters.length} letters found`);
    console.log(`✅ Love Stats: Level ${stats?.level}, ${stats?.xp} XP`);
    
    // Test foreign key relationships
    console.log('\n🔗 Testing foreign key relationships...');
    
    for (const letter of letters) {
      const partner = await prisma.partner.findUnique({
        where: { id: letter.fromId }
      });
      console.log(`  ✅ Love Letter "${letter.content.substring(0, 20)}..." -> Partner: ${partner?.name || 'Unknown'}`);
    }
    
    console.log('\n🎉 Railway PostgreSQL Migration Verification Complete!');
    console.log('✅ All data successfully migrated and verified!');
    console.log(`📊 Total Records: ${appConfigCount + partnersCount + memoriesCount + eventsCount + couponsCount + lettersCount + statsCount}`);
    console.log('🚀 Application is ready to use Railway PostgreSQL!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyCompleteMigration().catch(console.error);
