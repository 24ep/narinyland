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

async function debugLoveLetters() {
  try {
    console.log('🔍 Debugging Love Letters migration...\n');
    
    await sourcePrisma.$connect();
    await targetPrisma.$connect();
    
    const sourceLetters = await sourcePrisma.loveLetter.findMany();
    const targetLetters = await targetPrisma.loveLetter.findMany();
    
    console.log('📤 Source Love Letters:');
    sourceLetters.forEach((letter, i) => {
      console.log(`  ${i+1}. fromId: ${letter.fromId}, content: ${letter.content.substring(0, 30)}...`);
    });
    
    console.log('\n📥 Target Love Letters:');
    targetLetters.forEach((letter, i) => {
      console.log(`  ${i+1}. fromId: ${letter.fromId}, content: ${letter.content.substring(0, 30)}...`);
    });
    
    // Check partner mapping
    const sourcePartners = await sourcePrisma.partner.findMany();
    const targetPartners = await targetPrisma.partner.findMany();
    
    console.log('\n👥 Partner Mapping:');
    console.log('Source Partners:');
    sourcePartners.forEach(p => console.log(`  ${p.partnerId} -> ${p.id}`));
    console.log('Target Partners:');
    targetPartners.forEach(p => console.log(`  ${p.partnerId} -> ${p.id}`));
    
    // Test mapping logic
    console.log('\n🧪 Testing mapping logic:');
    for (const letter of sourceLetters) {
      const targetPartner = targetPartners.find(p => p.partnerId === letter.fromId);
      console.log(`  Letter fromId: ${letter.fromId} -> Target partner found: ${targetPartner ? targetPartner.id : 'NULL'}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

debugLoveLetters().catch(console.error);
