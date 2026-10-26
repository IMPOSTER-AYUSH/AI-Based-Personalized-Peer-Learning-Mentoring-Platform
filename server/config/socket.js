const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;
const userSockets = new Map(); // Map<userIdString, Set<socketId>>

const addOnlineUser = (userId, socketId) => {
  if (!userId) return;
  const uid = userId.toString();
  if (!userSockets.has(uid)) {
    userSockets.set(uid, new Set());
  }
  userSockets.get(uid).add(socketId);
};

const removeOnlineUser = (socketId) => {
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

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin === process.env.CLIENT_URL ||
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authenticate socket connection via JWT if provided
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
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
          // Token expired or invalid, connection allowed as anonymous or re-auth on user:online
          console.warn('Socket token verification warning:', jwtErr.message);
        }
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    // If authenticated via middleware, automatically join personal room
    if (socket.userId) {
      addOnlineUser(socket.userId, socket.id);
      socket.join(`user:${socket.userId}`);
      io.emit('users:online', Array.from(userSockets.keys()));
    }

    // Explicit user:online event (handles cases where client reconnects or sends user id)
    socket.on('user:online', (userId) => {
      if (!userId) return;
      const uid = userId.toString();
      socket.userId = uid;
      addOnlineUser(uid, socket.id);
      socket.join(`user:${uid}`);
      io.emit('users:online', Array.from(userSockets.keys()));
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
        // Broadcast to other clients in this conversation room
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

    socket.on('disconnect', () => {
      removeOnlineUser(socket.id);
      io.emit('users:online', Array.from(userSockets.keys()));
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
