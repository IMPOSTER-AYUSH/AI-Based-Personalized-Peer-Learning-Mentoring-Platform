require('dotenv').config();
const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Trigger initial DB connection & auto-seed if running as standalone process
if (require.main === module && !process.env.VERCEL) {
  connectDB().then(async () => {
    try {
      const User = require('./models/User');
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('🌱 Database is empty, auto-running seed...');
        const seedDatabase = require('./seed/seed');
        await seedDatabase();
      }
    } catch (err) {
      console.error('Seed check error:', err.message);
    }
  });
}

// Database connection middleware for serverless invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request middleware:', err.message);
    // Don't block requests if DB is temporarily connecting; routes handle individual DB errors
    next();
  }
});

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      callback(null, true); // Allow same domain in production
    },
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: 'Too many requests from this IP, please try again later.' },
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for uploaded files
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (_) {}
}
app.use('/uploads', express.static(uploadDir));

// Pre-register all Mongoose models so populate() refs are always available
require('./models/User');
require('./models/Badge');
require('./models/Community');
require('./models/Connection');
require('./models/Conversation');
require('./models/Message');
require('./models/Session');
require('./models/Goal');
require('./models/Transaction');
require('./models/Notification');
require('./models/Post');
require('./models/Comment');
require('./models/Event');
require('./models/Challenge');
require('./models/Review');
require('./models/Report');
require('./models/Contact');
require('./models/Skill');
require('./models/Blog');

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/community', require('./routes/community'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Standalone execution (Local Development)
if (require.main === module && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use by another process.`);
      console.error('   Run: node scripts/kill-port.js   to free it.');
      process.exit(1);
    } else {
      console.error('❌ Server error:', err.message);
    }
  });

  server.listen(PORT, () => {
    console.log(`🚀 SkillSwap Server running on port ${PORT}`);
  });

  // Graceful shutdown handlers for nodemon / process exit
  const handleShutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.once('SIGUSR2', () => {
    server.close(() => {
      process.kill(process.pid, 'SIGUSR2');
    });
  });

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}

// Export server instance for Vercel Serverless Function & WebSocket upgrade
module.exports = server;
module.exports.app = app;
module.exports.default = server;
