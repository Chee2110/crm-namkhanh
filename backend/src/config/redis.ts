import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

let redisClient: Redis | null = null;
let isRedisReady = false;

// Fallback in-memory store
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

try {
  redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) return null; // stop retry if offline, use fallback
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true
  });

  redisClient.connect().then(() => {
    isRedisReady = true;
    console.log(`📡 [Redis Cache] Đã kết nối thành công tới ${REDIS_HOST}:${REDIS_PORT}`);
  }).catch((err) => {
    console.warn(`⚠️ [Redis Cache] Không thể kết nối tới Redis (${err.message}), sử dụng In-Memory Cache thay thế.`);
    isRedisReady = false;
  });

  redisClient.on('error', (err) => {
    isRedisReady = false;
  });

  redisClient.on('ready', () => {
    isRedisReady = true;
  });
} catch (error: any) {
  console.warn(`⚠️ [Redis Cache] Khởi tạo Redis lỗi: ${error.message}, chuyển sang In-Memory Cache.`);
  isRedisReady = false;
}

export const cacheService = {
  async get<T = any>(key: string): Promise<T | null> {
    if (isRedisReady && redisClient) {
      try {
        const raw = await redisClient.get(key);
        if (raw) return JSON.parse(raw);
      } catch {
        // Fallback below
      }
    }

    const item = memoryStore.get(key);
    if (item && item.expiresAt > Date.now()) {
      return JSON.parse(item.value);
    }
    memoryStore.delete(key);
    return null;
  },

  async set(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    const serialized = JSON.stringify(data);

    if (isRedisReady && redisClient) {
      try {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch {
        // Fallback below
      }
    }

    memoryStore.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  },

  async del(key: string): Promise<void> {
    if (isRedisReady && redisClient) {
      try {
        await redisClient.del(key);
      } catch {}
    }
    memoryStore.delete(key);
  }
};
