import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Source: Supabase database
const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:a417528639qwerty@db.holputqklelihibuhfsj.supabase.co:6543/postgres?pgbouncer=true'
    }
  }
});

// Target: Railway database  
const targetPrisma = new PrismaClient();

async function migrateAllData() {
  console.log('🚀 Starting complete data migration from Supabase to Railway...\n');

  try {
    // Test connections
    console.log('📡 Testing database connections...');
    await sourcePrisma.$connect();
    await targetPrisma.$connect();
    console.log('✅ Both databases connected successfully!\n');

    // Get all data from Supabase
    console.log('📥 Extracting data from Supabase...');
    
    const [appConfig, partners, memories, timelineEvents, coupons, loveLetters, loveStats] = await Promise.all([
      sourcePrisma.appConfig.findMany(),
      sourcePrisma.partner.findMany(),
      sourcePrisma.memory.findMany(),
      sourcePrisma.timelineEvent.findMany(),
      sourcePrisma.coupon.findMany(),
      sourcePrisma.loveLetter.findMany(),
      sourcePrisma.loveStats.findMany()
    ]);

    console.log(`📊 Found data to migrate:
      - AppConfig: ${appConfig.length}
      - Partners: ${partners.length}
      - Memories: ${memories.length}
      - Timeline Events: ${timelineEvents.length}
      - Coupons: ${coupons.length}
      - Love Letters: ${loveLetters.length}
      - Love Stats: ${loveStats.length}`);

    // Clear target database (except base data)
    console.log('\n🧹 Preparing target database...');
    await targetPrisma.memory.deleteMany();
    await targetPrisma.timelineEvent.deleteMany();
    await targetPrisma.coupon.deleteMany();
    await targetPrisma.loveLetter.deleteMany();
    console.log('✅ Target database prepared');

    // Migrate data to Railway
    console.log('\n📤 Migrating data to Railway...');

    // Migrate AppConfig (upsert to preserve existing)
    console.log('  📋 Migrating AppConfig...');
    for (const config of appConfig) {
      await targetPrisma.appConfig.upsert({
        where: { id: config.id },
        update: {
          appName: config.appName,
          anniversaryDate: config.anniversaryDate,
          treeStyle: config.treeStyle,
          galleryStyle: config.galleryStyle,
          gallerySource: config.gallerySource,
          instagramUsername: config.instagramUsername,
          daysPerTree: config.daysPerTree,
          daysPerFlower: config.daysPerFlower,
          flowerType: config.flowerType,
          mixedFlowers: config.mixedFlowers,
          skyMode: config.skyMode,
          petType: config.petType,
          pets: config.pets,
          graphicsQuality: config.graphicsQuality,
          showQRCode: config.showQRCode,
          showCouponsOnTimeline: config.showCouponsOnTimeline,
          timelineCardScale: config.timelineCardScale,
          timelineDefaultRows: config.timelineDefaultRows,
          timelineLayoutMode: config.timelineLayoutMode,
          timelineZoomLevel: config.timelineZoomLevel,
          timelineThumbnailHeight: config.timelineThumbnailHeight,
          pwaName: config.pwaName,
          pwaShortName: config.pwaShortName,
          pwaDescription: config.pwaDescription,
          pwaThemeColor: config.pwaThemeColor,
          pwaBackgroundColor: config.pwaBackgroundColor,
          musicPlaylist: config.musicPlaylist,
          mailFolders: config.mailFolders,
          proposalQuestions: config.proposalQuestions,
          isProposalAccepted: config.isProposalAccepted,
          proposalProgress: config.proposalProgress,
        },
        create: config
      });
    }
    console.log(`  ✅ Migrated ${appConfig.length} AppConfig records`);

    // Migrate Partners
    console.log('  👥 Migrating Partners...');
    for (const partner of partners) {
      await targetPrisma.partner.upsert({
        where: { configId_partnerId: { configId: partner.configId, partnerId: partner.partnerId } },
        update: {
          name: partner.name,
          avatar: partner.avatar,
          points: partner.points,
          lifetimePoints: partner.lifetimePoints,
        },
        create: partner
      });
    }
    console.log(`  ✅ Migrated ${partners.length} Partner records`);

    // Migrate Memories
    console.log('  📸 Migrating Memories...');
    for (const memory of memories) {
      await targetPrisma.memory.create({
        data: {
          url: memory.url,
          s3Key: memory.s3Key,
          privacy: memory.privacy,
          caption: memory.caption,
          sortOrder: memory.sortOrder,
        }
      });
    }
    console.log(`  ✅ Migrated ${memories.length} Memory records`);

    // Migrate Timeline Events
    console.log('  📅 Migrating Timeline Events...');
    for (const event of timelineEvents) {
      await targetPrisma.timelineEvent.create({
        data: {
          text: event.text,
          type: event.type,
          location: event.location,
          timestamp: event.timestamp,
          mediaType: event.mediaType,
          mediaUrl: event.mediaUrl,
          mediaS3Key: event.mediaS3Key,
          mediaUrls: event.mediaUrls,
          mediaTypes: event.mediaTypes,
          mediaS3Keys: event.mediaS3Keys,
          configId: event.configId,
        }
      });
    }
    console.log(`  ✅ Migrated ${timelineEvents.length} Timeline Event records`);

    // Migrate Coupons
    console.log('  🎫 Migrating Coupons...');
    for (const coupon of coupons) {
      await targetPrisma.coupon.create({
        data: {
          title: coupon.title,
          emoji: coupon.emoji,
          desc: coupon.desc,
          color: coupon.color,
          points: coupon.points,
          forPartner: coupon.forPartner,
          isRedeemed: coupon.isRedeemed,
          redeemedAt: coupon.redeemedAt,
          configId: coupon.configId,
        }
      });
    }
    console.log(`  ✅ Migrated ${coupons.length} Coupon records`);

    // Migrate Love Letters (handle foreign key relationships)
    console.log('  💌 Migrating Love Letters...');
    
    // Create partner ID mapping
    const partnerMapping = new Map();
    const sourcePartners = await sourcePrisma.partner.findMany();
    const targetPartners = await targetPrisma.partner.findMany();
    
    // Map by UUID since Love Letters fromId references Partner.id (UUID), not partnerId
    for (const sourcePartner of sourcePartners) {
      const targetPartner = targetPartners.find(p => p.partnerId === sourcePartner.partnerId);
      if (targetPartner) {
        partnerMapping.set(sourcePartner.id, targetPartner.id);
        console.log(`  🔄 Mapping ${sourcePartner.partnerId}: ${sourcePartner.id} -> ${targetPartner.id}`);
      } else {
        console.log(`  ⚠️  No target partner found for ${sourcePartner.partnerId}`);
      }
    }
    
    let migratedLetters = 0;
    for (const letter of loveLetters) {
      // Love Letters use Partner.id (UUID) as fromId
      const targetPartnerId = partnerMapping.get(letter.fromId);
      
      if (targetPartnerId) {
        await targetPrisma.loveLetter.create({
          data: {
            content: letter.content,
            folder: letter.folder,
            unlockDate: letter.unlockDate,
            isRead: letter.isRead,
            readAt: letter.readAt,
            mediaType: letter.mediaType,
            mediaUrl: letter.mediaUrl,
            mediaS3Key: letter.mediaS3Key,
            fromId: targetPartnerId,
          }
        });
        migratedLetters++;
        console.log(`  ✅ Migrated Love Letter from ${letter.fromId}`);
      } else {
        console.log(`  ⚠️  Skipping Love Letter - Partner mapping not found: ${letter.fromId}`);
      }
    }
    console.log(`  ✅ Migrated ${migratedLetters} Love Letter records`);

    // Migrate Love Stats
    console.log('  💝 Migrating Love Stats...');
    for (const stats of loveStats) {
      await targetPrisma.loveStats.upsert({
        where: { id: stats.id },
        update: {
          xp: stats.xp,
          level: stats.level,
          leaves: stats.leaves,
          points: stats.points,
        },
        create: stats
      });
    }
    console.log(`  ✅ Migrated ${loveStats.length} Love Stats records`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const [targetAppConfig, finalPartners, targetMemories, targetEvents, targetCoupons, targetLetters, targetStats] = await Promise.all([
      targetPrisma.appConfig.findMany(),
      targetPrisma.partner.findMany(),
      targetPrisma.memory.findMany(),
      targetPrisma.timelineEvent.findMany(),
      targetPrisma.coupon.findMany(),
      targetPrisma.loveLetter.findMany(),
      targetPrisma.loveStats.findMany()
    ]);

    console.log('\n📊 Migration Summary:');
    console.log(`  AppConfig: ${appConfig.length} → ${targetAppConfig.length} ✅`);
    console.log(`  Partners: ${partners.length} → ${finalPartners.length} ✅`);
    console.log(`  Memories: ${memories.length} → ${targetMemories.length} ✅`);
    console.log(`  Timeline Events: ${timelineEvents.length} → ${targetEvents.length} ✅`);
    console.log(`  Coupons: ${coupons.length} → ${targetCoupons.length} ✅`);
    console.log(`  Love Letters: ${loveLetters.length} → ${targetLetters.length} ✅`);
    console.log(`  Love Stats: ${loveStats.length} → ${targetStats.length} ✅`);

    console.log('\n🎉 Complete data migration successful!');
    console.log('✅ All data has been migrated from Supabase to Railway PostgreSQL!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

migrateAllData().catch(console.error);
