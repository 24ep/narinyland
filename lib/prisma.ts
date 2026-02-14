import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: (() => {
          let url = process.env.DATABASE_URL;
          if (!url) return undefined;
          // Add connection limit if not present to avoid Supabase connection errors
          if (!url.includes('connection_limit')) {
             const separator = url.includes('?') ? '&' : '?';
             url = `${url}${separator}connection_limit=10&pool_timeout=15`;
          }

          // Detect Supabase Transaction Pooler (port 6543) and ensure pgbouncer=true
          if (url.includes(':6543') && !url.includes('pgbouncer=true')) {
             const separator = url.includes('?') ? '&' : '?';
             url = `${url}${separator}pgbouncer=true`;
          }
          
          return url;
        })(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
