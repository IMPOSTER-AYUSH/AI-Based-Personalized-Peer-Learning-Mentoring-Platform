const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  initRedis,
  getRedisAdapter,
  isRedisConfigured,
  addOnlineUserRedis,
  removeOnlineUserRedis,
  getOnlineUsersRedis,
  PRESENCE_CHANNEL,
  getSubClient,
} = require('./redis');

let io;
const userSockets = new Map(); // Local in-memory fallback: Map<userIdString, Set<socketId>>

const addOnlineUserLocal = (userId, socketId) => {
  if (!userId) return;
  const uid = userId.toString();
  if (!userSockets.has(uid)) {
    userSockets.set(uid, new Set());
  }
  userSockets.get(uid).add(socketId);
};

const removeOnlineUserLocal = (socketId) => {
  for (const [userId, sockets] of userSockets.entries()) {
    if (sockets.has(socketId)) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        userSockets.delete(userId);
      }
      break;
    }
  }
};

const broadcastOnlineUsers = async () => {
  if (!io) return;
  if (isRedisConfigured()) {
    const users = await getOnlineUsersRedis();
    io.emit('users:online', users);
  } else {
    io.emit('users:online', Array.from(userSockets.keys()));
  }
};

const initSocket = (server) => {
  if (io) {
    return io;
  }

  // Attempt to initialize Redis for multi-instance deployments
  initRedis();

  io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin === process.env.CLIENT_URL ||
          /\.vercel\.app$/.test(origin) ||
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        // Allow same-origin / forward in production
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Attach Redis adapter if configured (enables multi-instance coordination)
  const adapter = getRedisAdapter();
  if (adapter) {
    io.adapter(adapter);
    console.log('📡 Socket.IO Redis adapter attached');

    // Subscribe to presence synchronization channel
    const sub = getSubClient();
    if (sub) {
      sub.subscribe(PRESENCE_CHANNEL, (err) => {
        if (err) console.warn('Presence sub error:', err.message);
      });
      sub.on('message', async (channel, message) => {
        if (channel === PRESENCE_CHANNEL) {
          try {
            const users = await getOnlineUsersRedis();
            io.emit('users:online', users);
          } catch (e) {
            // ignore
          }
        }
      });
    }
  } else {
    console.log('ℹ️  Socket.IO using in-memory store (single-instance / local mode)');
  }

  // Authenticate socket connection via JWT if provided
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded && decoded.id) {
            const user = await User.findById(decoded.id).select('_id name email role');
            if (user) {
              socket.user = user;
              socket.userId = user._id.toString();
            }
          }
        } catch (jwtErr) {
          // Token expired or invalid, allowed as anonymous until user:online
          console.warn('Socket token verification warning:', jwtErr.message);
        }
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', async (socket) => {
    // If authenticated via middleware, automatically join personal room
    if (socket.userId) {
      addOnlineUserLocal(socket.userId, socket.id);
      await addOnlineUserRedis(socket.userId, socket.id);
      socket.join(`user:${socket.userId}`);
      await broadcastOnlineUsers();
    }

    // Explicit user:online event
    socket.on('user:online', async (userId) => {
      if (!userId) return;
      const uid = userId.toString();
      socket.userId = uid;
      addOnlineUserLocal(uid, socket.id);
      await addOnlineUserRedis(uid, socket.id);
      socket.join(`user:${uid}`);
      await broadcastOnlineUsers();
    });

    socket.on('chat:join', (conversationId) => {
      if (conversationId) {
        socket.join(`chat:${conversationId}`);
      }
    });

    socket.on('chat:leave', (conversationId) => {
      if (conversationId) {
        socket.leave(`chat:${conversationId}`);
      }
    });

    socket.on('chat:typing', ({ conversationId, userId, isTyping }) => {
      if (conversationId) {
        socket.to(`chat:${conversationId}`).emit('chat:typing', { userId, isTyping });
      }
    });

    socket.on('chat:message', (message) => {
      if (message?.conversation) {
        socket.to(`chat:${message.conversation}`).emit('chat:message', message);
      }
    });

    socket.on('chat:read', ({ conversationId, userId }) => {
      if (conversationId) {
        socket.to(`chat:${conversationId}`).emit('chat:read', { conversationId, userId });
      }
    });

    // WebRTC signaling
    socket.on('webrtc:offer', ({ to, offer, from }) => {
      if (to) {
        io.to(`user:${to}`).emit('webrtc:offer', { offer, from });
      }
    });

    socket.on('webrtc:answer', ({ to, answer, from }) => {
      if (to) {
        io.to(`user:${to}`).emit('webrtc:answer', { answer, from });
      }
    });

    socket.on('webrtc:ice-candidate', ({ to, candidate, from }) => {
      if (to) {
        io.to(`user:${to}`).emit('webrtc:ice-candidate', { candidate, from });
      }
    });

    socket.on('webrtc:end', ({ to }) => {
      if (to) {
        io.to(`user:${to}`).emit('webrtc:end');
      }
    });

    socket.on('notification:send', ({ to, notification }) => {
      if (to) {
        io.to(`user:${to}`).emit('notification:new', notification);
      }
    });

    socket.on('disconnect', async () => {
      removeOnlineUserLocal(socket.id);
      await removeOnlineUserRedis(socket.id);
      await broadcastOnlineUsers();
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const getOnlineUsers = () => {
  return new Map(Array.from(userSockets.entries()).map(([k, s]) => [k, Array.from(s)[0]]));
};

module.exports = { initSocket, getIO, getOnlineUsers };
