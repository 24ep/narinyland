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

    // Get all data from Supabase using raw queries to avoid schema mismatches
    console.log('📥 Extracting data from Supabase...');
    
    const appConfig = await sourcePrisma.$queryRaw`SELECT * FROM "AppConfig"`;
    const partners = await sourcePrisma.$queryRaw`SELECT * FROM "Partner"`;
    const memories = await sourcePrisma.$queryRaw`SELECT * FROM "Memory"`;
    const timelineEvents = await sourcePrisma.$queryRaw`SELECT * FROM "TimelineEvent"`;
    const coupons = await sourcePrisma.$queryRaw`SELECT * FROM "Coupon"`;
    const loveLetters = await sourcePrisma.$queryRaw`SELECT * FROM "LoveLetter"`;
    const loveStats = await sourcePrisma.$queryRaw`SELECT * FROM "LoveStats"`;

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
    await targetPrisma.partner.deleteMany();
    console.log('✅ Target database cleared');

    // Migrate Partners
    console.log('\n👥 Migrating Partners...');
    for (const partner of partners) {
      await targetPrisma.partner.create({
        data: {
          id: partner.id,
          partnerId: partner.partnerId,
          name: partner.name,
          avatar: partner.avatar,
          configId: partner.configId,
          points: partner.points || 0,
          lifetimePoints: partner.lifetimePoints || 0,
        }
      });
    }
    console.log(`✅ Migrated ${partners.length} partners`);

    // Migrate Memories
    console.log('\n📸 Migrating Memories...');
    for (const memory of memories) {
      await targetPrisma.memory.create({
        data: {
          id: memory.id,
          url: memory.url,
          s3Key: memory.s3Key,
          privacy: memory.privacy || 'public',
          caption: memory.caption,
          sortOrder: memory.sortOrder || 0,
          createdAt: memory.createdAt,
          updatedAt: memory.updatedAt,
        }
      });
    }
    console.log(`✅ Migrated ${memories.length} memories`);

    // Migrate Timeline Events
    console.log('\n📅 Migrating Timeline Events...');
    for (const event of timelineEvents) {
      await targetPrisma.timelineEvent.create({
        data: {
          id: event.id,
          text: event.text,
          type: event.type,
          location: event.location,
          timestamp: event.timestamp,
          mediaType: event.mediaType,
          mediaUrl: event.mediaUrl,
          mediaS3Key: event.mediaS3Key,
          mediaUrls: event.mediaUrls || [],
          mediaTypes: event.mediaTypes || [],
          mediaS3Keys: event.mediaS3Keys || [],
          configId: event.configId,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        }
      });
    }
    console.log(`✅ Migrated ${timelineEvents.length} timeline events`);

    // Migrate Coupons
    console.log('\n🎫 Migrating Coupons...');
    for (const coupon of coupons) {
      await targetPrisma.coupon.create({
        data: {
          id: coupon.id,
          title: coupon.title,
          emoji: coupon.emoji,
          desc: coupon.desc,
          color: coupon.color,
          points: coupon.points || 0,
          forPartner: coupon.forPartner,
          isRedeemed: coupon.isRedeemed || false,
          redeemedAt: coupon.redeemedAt,
          configId: coupon.configId,
          createdAt: coupon.createdAt,
          updatedAt: coupon.updatedAt,
        }
      });
    }
    console.log(`✅ Migrated ${coupons.length} coupons`);

    // Migrate Love Letters
    console.log('\n💝 Migrating Love Letters...');
    for (const letter of loveLetters) {
      await targetPrisma.loveLetter.create({
        data: {
          id: letter.id,
          content: letter.content,
          fromId: letter.fromId,
          folder: letter.folder || 'Inbox',
          unlockDate: letter.unlockDate,
          isRead: letter.isRead || false,
          readAt: letter.readAt,
          mediaType: letter.mediaType,
          mediaUrl: letter.mediaUrl,
          mediaS3Key: letter.mediaS3Key,
          createdAt: letter.createdAt,
          updatedAt: letter.updatedAt,
        }
      });
    }
    console.log(`✅ Migrated ${loveLetters.length} love letters`);

    // Update AppConfig (merge with existing)
    console.log('\n⚙️ Updating AppConfig...');
    if (appConfig.length > 0) {
      const sourceConfig = appConfig[0];
      await targetPrisma.appConfig.update({
        where: { id: 'default' },
        data: {
          appName: sourceConfig.appName || 'Narinyland',
          anniversaryDate: sourceConfig.anniversaryDate || new Date(),
          treeStyle: sourceConfig.treeStyle || 'sakura',
          galleryStyle: sourceConfig.galleryStyle || 'carousel',
          gallerySource: sourceConfig.gallerySource || 'manual',
          instagramUsername: sourceConfig.instagramUsername || '',
          daysPerTree: sourceConfig.daysPerTree || 100,
          daysPerFlower: sourceConfig.daysPerFlower || 7,
          flowerType: sourceConfig.flowerType || 'sunflower',
          mixedFlowers: sourceConfig.mixedFlowers || ['sunflower', 'tulip', 'rose'],
          skyMode: sourceConfig.skyMode || 'follow_timezone',
          petType: sourceConfig.petType || 'cat',
          pets: sourceConfig.pets || [],
          graphicsQuality: sourceConfig.graphicsQuality || 'medium',
          showQRCode: sourceConfig.showQRCode || false,
          showCouponsOnTimeline: sourceConfig.showCouponsOnTimeline !== false,
          timelineCardScale: sourceConfig.timelineCardScale || 1.0,
          timelineDefaultRows: sourceConfig.timelineDefaultRows || 5,
          timelineLayoutMode: sourceConfig.timelineLayoutMode || 'vertical',
          timelineZoomLevel: sourceConfig.timelineZoomLevel || 0,
          timelineThumbnailHeight: sourceConfig.timelineThumbnailHeight || 150,
          pwaName: sourceConfig.pwaName || 'Narinyland',
          pwaShortName: sourceConfig.pwaShortName || 'Narinyland',
          pwaDescription: sourceConfig.pwaDescription || 'Our Love Story',
          pwaThemeColor: sourceConfig.pwaThemeColor || '#ec4899',
          pwaBackgroundColor: sourceConfig.pwaBackgroundColor || '#ffffff',
          pwaIconUrl: sourceConfig.pwaIconUrl,
          musicPlaylist: sourceConfig.musicPlaylist || [],
          mailFolders: sourceConfig.mailFolders || ['Inbox', 'Archive', 'Trash'],
          proposalQuestions: sourceConfig.proposalQuestions || [],
          isProposalAccepted: sourceConfig.isProposalAccepted || false,
          proposalProgress: sourceConfig.proposalProgress || 0,
          gallery: sourceConfig.gallery || [],
        }
      });
    }
    console.log('✅ AppConfig updated');

    console.log('\n🎉 Migration completed successfully!');
    console.log('📈 All data has been migrated from Supabase to Railway PostgreSQL');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

migrateAllData();
