-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "appName" TEXT NOT NULL DEFAULT 'Narinyland',
    "anniversaryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "treeStyle" TEXT NOT NULL DEFAULT 'sakura',
    "galleryStyle" TEXT NOT NULL DEFAULT 'carousel',
    "gallerySource" TEXT NOT NULL DEFAULT 'manual',
    "instagramUsername" TEXT NOT NULL DEFAULT '',
    "daysPerTree" INTEGER NOT NULL DEFAULT 100,
    "daysPerFlower" INTEGER NOT NULL DEFAULT 7,
    "flowerType" TEXT NOT NULL DEFAULT 'sunflower',
    "mixedFlowers" TEXT[] DEFAULT ARRAY['sunflower', 'tulip', 'rose', 'cherry', 'lavender', 'heart']::TEXT[],
    "skyMode" TEXT NOT NULL DEFAULT 'follow_timezone',
    "petType" TEXT NOT NULL DEFAULT 'cat',
    "pets" JSONB NOT NULL DEFAULT '[]',
    "graphicsQuality" TEXT NOT NULL DEFAULT 'medium',
    "showQRCode" BOOLEAN NOT NULL DEFAULT false,
    "showCouponsOnTimeline" BOOLEAN NOT NULL DEFAULT true,
    "timelineCardScale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "timelineDefaultRows" INTEGER NOT NULL DEFAULT 5,
    "timelineLayoutMode" TEXT NOT NULL DEFAULT 'vertical',
    "timelineZoomLevel" INTEGER NOT NULL DEFAULT 0,
    "timelineThumbnailHeight" INTEGER NOT NULL DEFAULT 150,
    "pwaName" TEXT NOT NULL DEFAULT 'Narinyland',
    "pwaShortName" TEXT NOT NULL DEFAULT 'Narinyland',
    "pwaDescription" TEXT NOT NULL DEFAULT 'Our Love Story',
    "pwaThemeColor" TEXT NOT NULL DEFAULT '#ec4899',
    "pwaBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "pwaIconUrl" TEXT,
    "musicPlaylist" TEXT[] DEFAULT ARRAY['https://www.youtube.com/watch?v=5qap5aO4i9A']::TEXT[],
    "mailFolders" TEXT[] DEFAULT ARRAY['Inbox', 'Archive', 'Trash']::TEXT[],
    "proposalQuestions" TEXT[] DEFAULT ARRAY['Will you be my Valentine?', 'Jaroonwit is so handsome, right?']::TEXT[],
    "isProposalAccepted" BOOLEAN NOT NULL DEFAULT false,
    "proposalProgress" INTEGER NOT NULL DEFAULT 0,
    "gallery" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "s3Key" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'public',
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "mediaType" TEXT,
    "mediaUrl" TEXT,
    "mediaS3Key" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mediaTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mediaS3Keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "configId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoveLetter" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "folder" TEXT NOT NULL DEFAULT 'Inbox',
    "unlockDate" TIMESTAMP(3) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "mediaType" TEXT,
    "mediaUrl" TEXT,
    "mediaS3Key" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoveLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "forPartner" TEXT NOT NULL,
    "isRedeemed" BOOLEAN NOT NULL DEFAULT false,
    "redeemedAt" TIMESTAMP(3),
    "configId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoveStats" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "leaves" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoveStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_configId_partnerId_key" ON "Partner"("configId", "partnerId");

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_configId_fkey" FOREIGN KEY ("configId") REFERENCES "AppConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_configId_fkey" FOREIGN KEY ("configId") REFERENCES "AppConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoveLetter" ADD CONSTRAINT "LoveLetter_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_configId_fkey" FOREIGN KEY ("configId") REFERENCES "AppConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
