const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Untitled Dashboard'
  },
  dataFilename: {
    type: String, // Reference to the file uploaded locally
    required: true
  },
  schema: {
    type: Array, // The column definitions inferred by the backend
    required: true
  },
  widgets: {
    type: Array, // The charts/widgets configs
    default: []
  },
  layout: {
    type: Array, // The react-grid-layout configuration
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Dashboard', dashboardSchema);
