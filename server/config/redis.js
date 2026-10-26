const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');

let pubClient = null;
let subClient = null;
let redisClient = null;
let isRedisEnabled = false;

const initRedis = () => {
  const redisUrl =
    process.env.REDIS_URL ||
    process.env.KV_URL ||
    process.env.REDIS_URI;

  if (!redisUrl) {
    return null;
  }

  if (isRedisEnabled && pubClient) {
    return { pubClient, subClient, redisClient };
  }

  try {
    const isTls = redisUrl.startsWith('rediss://');
    const redisOptions = {
      retryStrategy(times) {
        if (times > 10) {
          console.warn('⚠️ Redis retry limit reached.');
          return null;
        }
        return Math.min(times * 150, 2000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
    };

    pubClient = new Redis(redisUrl, redisOptions);
    subClient = pubClient.duplicate();
    redisClient = pubClient.duplicate();

    pubClient.on('error', (err) => console.warn('Redis Pub error:', err.message));
    subClient.on('error', (err) => console.warn('Redis Sub error:', err.message));
    redisClient.on('error', (err) => console.warn('Redis Client error:', err.message));

    // Connect asynchronously
    Promise.all([pubClient.connect(), subClient.connect(), redisClient.connect()])
      .then(() => {
        isRedisEnabled = true;
        console.log('✅ Redis connected: multi-instance Socket.IO coordination active');
      })
      .catch((err) => {
        console.warn('⚠️ Redis initial connection failed:', err.message);
        isRedisEnabled = false;
      });

    return { pubClient, subClient, redisClient };
  } catch (err) {
    console.warn('⚠️ Could not initialize Redis client:', err.message);
    return null;
  }
};

const getRedisAdapter = () => {
  if (!isRedisEnabled) {
    initRedis();
  }
  if (pubClient && subClient) {
    try {
      return createAdapter(pubClient, subClient);
    } catch (err) {
      console.warn('⚠️ Could not create Socket.IO Redis adapter:', err.message);
      return null;
    }
  }
  return null;
};

// Distributed presence tracking
const PRESENCE_HASH = 'connectskill:users:online';
const SOCKET_MAP = 'connectskill:sockets:to:users';
const PRESENCE_CHANNEL = 'connectskill:presence:sync';

const addOnlineUserRedis = async (userId, socketId) => {
  if (!redisClient || !isRedisEnabled) return;
  try {
    const uid = userId.toString();
    await redisClient.hincrby(PRESENCE_HASH, uid, 1);
    await redisClient.hset(SOCKET_MAP, socketId, uid);
    if (pubClient) {
      await pubClient.publish(PRESENCE_CHANNEL, JSON.stringify({ type: 'online', userId: uid }));
    }
  } catch (err) {
    console.warn('Redis addOnlineUser error:', err.message);
  }
};

const removeOnlineUserRedis = async (socketId) => {
  if (!redisClient || !isRedisEnabled) return;
  try {
    const uid = await redisClient.hget(SOCKET_MAP, socketId);
    if (uid) {
      await redisClient.hdel(SOCKET_MAP, socketId);
      const remaining = await redisClient.hincrby(PRESENCE_HASH, uid, -1);
      if (remaining <= 0) {
        await redisClient.hdel(PRESENCE_HASH, uid);
      }
      if (pubClient) {
        await pubClient.publish(PRESENCE_CHANNEL, JSON.stringify({ type: 'offline', userId: uid }));
      }
    }
  } catch (err) {
    console.warn('Redis removeOnlineUser error:', err.message);
  }
};

const getOnlineUsersRedis = async () => {
  if (!redisClient || !isRedisEnabled) return [];
  try {
    const keys = await redisClient.hkeys(PRESENCE_HASH);
    return keys || [];
  } catch (err) {
    console.warn('Redis getOnlineUsers error:', err.message);
    return [];
  }
};

module.exports = {
  initRedis,
  getRedisAdapter,
  isRedisConfigured: () => isRedisEnabled,
  addOnlineUserRedis,
  removeOnlineUserRedis,
  getOnlineUsersRedis,
  PRESENCE_CHANNEL,
  getSubClient: () => subClient,
};
