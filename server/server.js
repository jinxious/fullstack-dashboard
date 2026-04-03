const express = require('express');
const cors = require('cors');

const uploadRoutes = require('./routes/upload');
const dashboardRoutes = require('./routes/dashboards');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// For now DB connection is optional, we run completely in memory if MONGODB_URI is not set
if (process.env.MONGODB_URI) {
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error (gracefully degrading to memory mode):', err.message));
} else {
  console.log('MONGODB_URI not provided. Running in memory-only mode for dashboard states.');
}

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
