const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  expectedColumns: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['string', 'number', 'date'], default: 'string' },
    role: { type: String, enum: ['xAxis', 'yAxis', 'category', 'filter', 'none'], default: 'none' }
  }],
  widgets: {
    type: Array,
    default: []
  },
  layout: {
    type: Array,
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Template', templateSchema);
