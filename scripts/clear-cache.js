import { redis } from '../lib/redis';

async function clearCache() {
  try {
    console.log('🗑️  Clearing Redis cache...');
    await redis.del('app_config');
    console.log('✅ Cache cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}

clearCache();
