const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during dev
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static folder for local uploaded file fallback
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// General API rate limiter
app.use('/api', apiLimiter);

// Health check endpoint
app.get(['/api/health', '/health', '/'], (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Kabi Notes API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// API Routes (supports both /api/auth and /auth endpoints)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/notes', noteRoutes);
app.use('/notes', noteRoutes);

app.use('/api/files', fileRoutes);
app.use('/files', fileRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
