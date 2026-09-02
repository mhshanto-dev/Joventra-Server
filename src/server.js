import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { apiLimiter, authLimiter } from './middlewares/rateLimiter.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import companyRoutes from './routes/company.routes.js';
import jobRoutes from './routes/job.routes.js';
import applicationRoutes from './routes/application.routes.js';
import savedJobRoutes from './routes/savedJob.routes.js';
import adminRoutes from './routes/admin.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import recruiterRoutes from './routes/recruiter.routes.js';
import seekerRoutes from './routes/seeker.routes.js';
import searchRoutes from './routes/search.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure upload directories exist based on ENV.UPLOAD_DIR
const uploadDir = path.isAbsolute(ENV.UPLOAD_DIR)
  ? ENV.UPLOAD_DIR
  : path.resolve(__dirname, '..', ENV.UPLOAD_DIR);

if (!process.env.VERCEL && !fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create upload dir:', err);
  }
}

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = Array.from(new Set([
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean)));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      ENV.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply general rate limiter
app.use('/api', apiLimiter);

// Stripe webhook requires raw body, handle standard json for others
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static files for uploaded assets
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/saved-jobs', savedJobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/seeker', seekerRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Joventra API is running healthy',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint for Vercel health inspection
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Joventra API Server is live',
    health: '/api/health'
  });
});

// 404 handler for unknown routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server!`,
  });
});

// Centralized error handling middleware
app.use(errorHandler);

// App launcher (only when running locally or traditional server, not Vercel serverless)
const PORT = ENV.PORT;
if (!process.env.VERCEL && ENV.NODE_ENV !== 'test') {
  connectDB();
  app.listen(PORT, () => {
    console.log(`[Joventra Server] Running in ${ENV.NODE_ENV} mode on port ${PORT}`);
  });
}

export default app;
