import prisma from './lib/prisma.js';

async function checkSchema() {
  try {
    const columns: any[] = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'TimelineEvent'
    `);
    console.log('Columns in TimelineEvent:', columns.map(c => c.column_name));
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
