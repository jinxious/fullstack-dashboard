require('dotenv').config();
const express = require('express');
const cors = require('cors');

const uploadRoutes = require('./routes/upload');
const dashboardRoutes = require('./routes/dashboards');
const exportRoutes = require('./routes/export');
const authRoutes = require('./routes/auth');
const templateRoutes = require('./routes/templates');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Connect to MongoDB if URI provided
if (process.env.MONGODB_URI) {
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error (gracefully degrading to memory mode):', err.message));
} else {
  console.log('MONGODB_URI not provided. Running in memory-only mode.');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Self-ping mechanism to keep Render server awake
// Render free tier sleeps after 15 mins of inactivity. Ping every 14 mins.
const https = require('https');
if (process.env.RENDER_EXTERNAL_URL) {
  const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
  setInterval(() => {
    console.log('Sending keep-awake ping...');
    https.get(`${process.env.RENDER_EXTERNAL_URL}/api/health`, (res) => {
      console.log(`Keep-awake ping status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.log('Keep-awake ping failed:', err.message);
    });
  }, PING_INTERVAL);
}
