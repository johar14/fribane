import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import routesRoutes from './routes/routes';
import pushRoutes from './routes/push';
import statsRoutes from './routes/stats';

import { initWebPush } from './services/pushService';
import { startTrafficMonitor } from './services/trafficService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/stats', statsRoutes);

// Auth redirect
app.use('/auth', authRoutes);

// SPA fallback – server app.html til /app
app.get('/app', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/app.html'));
});

// Landing page
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/landing.html'));
});

// Service Worker
app.get('/sw.js', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/sw.js'));
});

// Start server
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fribane');
    console.log('✅ MongoDB forbundet');

    initWebPush();
    await startTrafficMonitor();

    app.listen(PORT, () => {
      console.log(`\n🚦 Fribane kører på http://localhost:${PORT}`);
      console.log(`   Landing page: http://localhost:${PORT}/`);
      console.log(`   App:          http://localhost:${PORT}/app\n`);
    });
  } catch (err) {
    console.error('Startup fejl:', err);
    process.exit(1);
  }
}

start();
