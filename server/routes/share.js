const express = require('express');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const router = express.Router();
const crypto = require('crypto');

let Dashboard, User;
try { Dashboard = require('../models/Dashboard'); } catch (e) {}
try { User = require('../models/User'); } catch (e) {}

// In-memory fallback store (mirrors memoryDB from dashboards.js)
const memDB = require('./dashboards').memoryDB || {};

const generateShareId = () => crypto.randomBytes(10).toString('hex');

// Helper: check if requester has access to a dashboard and at what role
function resolveRole(dashboard, userId) {
  const ownerId = dashboard.userId?.toString?.() || dashboard.userId;
  if (ownerId === userId) return 'owner';

  // Check per-user permissions
  const perm = dashboard.permissions?.find(p => p.userId?.toString() === userId);
  if (perm) return perm.role;

  // Link-based access (anyone with link)
  if (dashboard.isPublic && dashboard.linkAccess && dashboard.linkAccess !== 'none') {
    return dashboard.linkAccess;
  }

  return null;
}

// GET /api/share/view/:shareId — public view by shareId (no auth required)
router.get('/view/:shareId', optionalAuth, async (req, res) => {
  try {
    let dashboard;

    if (process.env.MONGODB_URI && Dashboard) {
      dashboard = await Dashboard.findOne({ shareId: req.params.shareId });
    } else {
      dashboard = Object.values(memDB).find(d => d.shareId === req.params.shareId);
    }

    if (!dashboard) return res.status(404).json({ success: false, message: 'Shared dashboard not found' });

    // Determine role for this viewer
    let role = null;
    if (req.user) {
      role = resolveRole(dashboard, req.user.id);
    }

    // If not a registered user with direct access, use link access
    if (!role) {
      if (!dashboard.isPublic) {
        return res.status(403).json({ success: false, message: 'This dashboard is private' });
      }
      role = dashboard.linkAccess || 'viewer';
    }

    if (role === 'none' || !role) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Increment view count
    if (process.env.MONGODB_URI && Dashboard) {
      await Dashboard.findByIdAndUpdate(dashboard._id, { $inc: { viewCount: 1 } });
    } else if (memDB[dashboard.id]) {
      memDB[dashboard.id].viewCount = (memDB[dashboard.id].viewCount || 0) + 1;
    }

    // Load dataset
    const filePath = path.join(__dirname, '../uploads', dashboard.dataFilename);
    let data = [];
    if (fs.existsSync(filePath)) {
      const workbook = xlsx.readFile(filePath, { cellDates: true });
      const sheetName = workbook.SheetNames[0];
      data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
    }

    res.json({
      success: true,
      role,
      dashboard: {
        id: dashboard._id || dashboard.id,
        title: dashboard.title,
        schema: dashboard.schema,
        widgets: dashboard.widgets,
        layout: dashboard.layout,
        metadata: dashboard.metadata || {},
        theme: dashboard.theme || {},
        isPublic: dashboard.isPublic,
        linkAccess: dashboard.linkAccess,
        shareId: dashboard.shareId,
        viewCount: dashboard.viewCount,
        shareCreatedAt: dashboard.shareCreatedAt
      },
      data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load shared dashboard' });
  }
});

// GET /api/share/:dashboardId — get sharing settings (owner only)
router.get('/:dashboardId', authMiddleware, async (req, res) => {
  try {
    let dashboard;
    if (process.env.MONGODB_URI && Dashboard) {
      dashboard = await Dashboard.findById(req.params.dashboardId).populate('permissions.userId', 'name email');
    } else {
      dashboard = memDB[req.params.dashboardId];
    }

    if (!dashboard) return res.status(404).json({ success: false, message: 'Not found' });

    const ownerId = dashboard.userId?.toString?.() || dashboard.userId;
    if (ownerId !== req.user.id) return res.status(403).json({ success: false, message: 'Only owners can view sharing settings' });

    res.json({
      success: true,
      sharing: {
        shareId: dashboard.shareId || null,
        isPublic: dashboard.isPublic || false,
        linkAccess: dashboard.linkAccess || 'viewer',
        permissions: dashboard.permissions || [],
        viewCount: dashboard.viewCount || 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get sharing settings' });
  }
});

// POST /api/share/:dashboardId/enable — generate shareId and enable sharing
router.post('/:dashboardId/enable', authMiddleware, async (req, res) => {
  try {
    const { isPublic = true, linkAccess = 'viewer' } = req.body;

    if (process.env.MONGODB_URI && Dashboard) {
      const dashboard = await Dashboard.findById(req.params.dashboardId);
      if (!dashboard) return res.status(404).json({ success: false, message: 'Not found' });
      if (dashboard.userId.toString() !== req.user.id) return res.status(403).json({ success: false });

      if (!dashboard.shareId) {
        dashboard.shareId = generateShareId();
        dashboard.shareCreatedAt = new Date();
      }
      dashboard.isPublic = isPublic;
      dashboard.linkAccess = linkAccess;
      await dashboard.save();

      return res.json({ success: true, shareId: dashboard.shareId, isPublic: dashboard.isPublic, linkAccess: dashboard.linkAccess });
    } else {
      const dashboard = memDB[req.params.dashboardId];
      if (!dashboard) return res.status(404).json({ success: false, message: 'Not found' });
      if (dashboard.userId !== req.user.id) return res.status(403).json({ success: false });

      if (!dashboard.shareId) {
        dashboard.shareId = generateShareId();
        dashboard.shareCreatedAt = new Date();
      }
      dashboard.isPublic = isPublic;
      dashboard.linkAccess = linkAccess;
      dashboard.permissions = dashboard.permissions || [];

      return res.json({ success: true, shareId: dashboard.shareId, isPublic: dashboard.isPublic, linkAccess: dashboard.linkAccess });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to enable sharing' });
  }
});

// PATCH /api/share/:dashboardId — update sharing settings (public/private, linkAccess)
router.patch('/:dashboardId', authMiddleware, async (req, res) => {
  try {
    const { isPublic, linkAccess } = req.body;

    if (process.env.MONGODB_URI && Dashboard) {
      const dashboard = await Dashboard.findById(req.params.dashboardId);
      if (!dashboard) return res.status(404).json({ success: false });
      if (dashboard.userId.toString() !== req.user.id) return res.status(403).json({ success: false });

      if (isPublic !== undefined) dashboard.isPublic = isPublic;
      if (linkAccess !== undefined) dashboard.linkAccess = linkAccess;
      await dashboard.save();
      return res.json({ success: true });
    } else {
      const dashboard = memDB[req.params.dashboardId];
      if (!dashboard) return res.status(404).json({ success: false });
      if (dashboard.userId !== req.user.id) return res.status(403).json({ success: false });

      if (isPublic !== undefined) dashboard.isPublic = isPublic;
      if (linkAccess !== undefined) dashboard.linkAccess = linkAccess;
      return res.json({ success: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update sharing' });
  }
});

// POST /api/share/:dashboardId/permissions — add/update user permission
router.post('/:dashboardId/permissions', authMiddleware, async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ success: false, message: 'Email and role required' });

    if (process.env.MONGODB_URI && Dashboard) {
      const dashboard = await Dashboard.findById(req.params.dashboardId);
      if (!dashboard) return res.status(404).json({ success: false });
      if (dashboard.userId.toString() !== req.user.id) return res.status(403).json({ success: false });

      // Look up user by email
      let targetUser = null;
      if (User) targetUser = await User.findOne({ email: email.toLowerCase() });

      const existing = dashboard.permissions.findIndex(p => p.email === email.toLowerCase());
      const permEntry = {
        userId: targetUser?._id || null,
        email: email.toLowerCase(),
        name: targetUser?.name || email,
        role
      };

      if (existing >= 0) dashboard.permissions[existing] = permEntry;
      else dashboard.permissions.push(permEntry);

      await dashboard.save();
      return res.json({ success: true, permissions: dashboard.permissions });
    } else {
      const dashboard = memDB[req.params.dashboardId];
      if (!dashboard) return res.status(404).json({ success: false });
      if (dashboard.userId !== req.user.id) return res.status(403).json({ success: false });

      dashboard.permissions = dashboard.permissions || [];
      const existing = dashboard.permissions.findIndex(p => p.email === email.toLowerCase());
      const permEntry = { email: email.toLowerCase(), name: email, role };
      if (existing >= 0) dashboard.permissions[existing] = permEntry;
      else dashboard.permissions.push(permEntry);

      return res.json({ success: true, permissions: dashboard.permissions });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add permission' });
  }
});

// DELETE /api/share/:dashboardId/permissions/:email — remove user permission
router.delete('/:dashboardId/permissions/:email', authMiddleware, async (req, res) => {
  try {
    const emailToRemove = decodeURIComponent(req.params.email).toLowerCase();

    if (process.env.MONGODB_URI && Dashboard) {
      const dashboard = await Dashboard.findById(req.params.dashboardId);
      if (!dashboard) return res.status(404).json({ success: false });
      if (dashboard.userId.toString() !== req.user.id) return res.status(403).json({ success: false });

      dashboard.permissions = dashboard.permissions.filter(p => p.email !== emailToRemove);
      await dashboard.save();
      return res.json({ success: true, permissions: dashboard.permissions });
    } else {
      const dashboard = memDB[req.params.dashboardId];
      if (!dashboard) return res.status(404).json({ success: false });
      dashboard.permissions = (dashboard.permissions || []).filter(p => p.email !== emailToRemove);
      return res.json({ success: true, permissions: dashboard.permissions });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to remove permission' });
  }
});

module.exports = router;
