const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const permissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, lowercase: true, trim: true },
  name: { type: String },
  role: { type: String, enum: ['viewer', 'commenter', 'editor'], default: 'viewer' }
}, { _id: false });

const dashboardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Untitled Dashboard' },
  dataFilename: { type: String, required: true },
  schema: { type: Array, required: true },
  widgets: { type: Array, default: [] },
  layout: { type: Array, default: [] },
  metadata: { type: Object, default: {} },
  theme: { type: Object, default: {} },

  // Sharing
  shareId: { type: String, unique: true, sparse: true },
  isPublic: { type: Boolean, default: false },
  linkAccess: { 
    type: String, 
    enum: ['none', 'viewer', 'commenter', 'editor'], 
    default: 'viewer' 
  },
  permissions: { type: [permissionSchema], default: [] },
  viewCount: { type: Number, default: 0 },
  shareCreatedAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

dashboardSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Generate unique shareId
dashboardSchema.methods.generateShareId = function () {
  if (!this.shareId) {
    this.shareId = uuidv4().replace(/-/g, '').substring(0, 20);
    this.shareCreatedAt = new Date();
  }
  return this.shareId;
};

module.exports = mongoose.model('Dashboard', dashboardSchema);
