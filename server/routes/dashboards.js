const express = require('express');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

let Dashboard;
try {
  Dashboard = require('../models/Dashboard');
} catch (e) {
  console.log("Dashboard model unavailable");
}

// In-memory fallback
const memoryDB = {};
module.exports.memoryDB = memoryDB;

// GET /api/dashboards — list user's dashboards
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (process.env.MONGODB_URI && Dashboard) {
      const dashboards = await Dashboard.find({ userId: req.user.id })
        .select('title widgets layout schema createdAt updatedAt dataFilename')
        .sort({ updatedAt: -1 });
      return res.json({ success: true, dashboards });
    } else {
      const userDashboards = Object.values(memoryDB)
        .filter(d => d.userId === req.user.id)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      return res.json({ success: true, dashboards: userDashboards });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboards' });
  }
});

// POST /api/dashboards — save new dashboard
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, dataFilename, schema, widgets, layout } = req.body;

    let id;
    if (process.env.MONGODB_URI && Dashboard) {
      const newDash = new Dashboard({
        userId: req.user.id,
        title,
        dataFilename,
        schema,
        widgets,
        layout
      });
      const saved = await newDash.save();
      id = saved._id.toString();
    } else {
      id = 'dash_' + Date.now();
      memoryDB[id] = {
        id, _id: id,
        userId: req.user.id,
        title, dataFilename, schema, widgets, layout,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to save dashboard' });
  }
});

// PUT /api/dashboards/:id — update dashboard
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, widgets, layout, schema } = req.body;

    if (process.env.MONGODB_URI && Dashboard) {
      const dashboard = await Dashboard.findById(req.params.id);
      if (!dashboard) return res.status(404).json({ success: false, message: 'Dashboard not found' });
      if (dashboard.userId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      if (title !== undefined) dashboard.title = title;
      if (widgets !== undefined) dashboard.widgets = widgets;
      if (layout !== undefined) dashboard.layout = layout;
      if (schema !== undefined) dashboard.schema = schema;
      await dashboard.save();

      return res.json({ success: true, dashboard });
    } else {
      const dashboard = memoryDB[req.params.id];
      if (!dashboard) return res.status(404).json({ success: false, message: 'Dashboard not found' });
      if (dashboard.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      if (title !== undefined) dashboard.title = title;
      if (widgets !== undefined) dashboard.widgets = widgets;
      if (layout !== undefined) dashboard.layout = layout;
      if (schema !== undefined) dashboard.schema = schema;
      dashboard.updatedAt = new Date();

      return res.json({ success: true, dashboard });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update dashboard' });
  }
});

// DELETE /api/dashboards/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (process.env.MONGODB_URI && Dashboard) {
      const dashboard = await Dashboard.findById(req.params.id);
      if (!dashboard) return res.status(404).json({ success: false, message: 'Not found' });
      if (dashboard.userId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      await Dashboard.findByIdAndDelete(req.params.id);
    } else {
      const dashboard = memoryDB[req.params.id];
      if (!dashboard) return res.status(404).json({ success: false, message: 'Not found' });
      if (dashboard.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      delete memoryDB[req.params.id];
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete dashboard' });
  }
});

// POST /api/dashboards/:id/duplicate
router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    let original;
    if (process.env.MONGODB_URI && Dashboard) {
      original = await Dashboard.findById(req.params.id);
    } else {
      original = memoryDB[req.params.id];
    }

    if (!original) return res.status(404).json({ success: false, message: 'Not found' });
    if ((original.userId?.toString?.() || original.userId) !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let id;
    if (process.env.MONGODB_URI && Dashboard) {
      const dup = new Dashboard({
        userId: req.user.id,
        title: `${original.title} (Copy)`,
        dataFilename: original.dataFilename,
        schema: original.schema,
        widgets: original.widgets,
        layout: original.layout
      });
      const saved = await dup.save();
      id = saved._id.toString();
    } else {
      id = 'dash_' + Date.now();
      memoryDB[id] = {
        ...original, id, _id: id,
        title: `${original.title} (Copy)`,
        createdAt: new Date(), updatedAt: new Date()
      };
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to duplicate dashboard' });
  }
});

// GET /api/dashboards/:id — public view (for sharing)
router.get('/:id', async (req, res) => {
  try {
    let dashboard;
    if (process.env.MONGODB_URI && Dashboard) {
      dashboard = await Dashboard.findById(req.params.id);
    } else {
      dashboard = memoryDB[req.params.id];
    }

    if (!dashboard) {
      return res.status(404).json({ success: false, message: 'Dashboard not found' });
    }

    const filePath = path.join(__dirname, '../uploads', dashboard.dataFilename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Associated dataset file is missing from server' });
    }

    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

    res.json({
      success: true,
      dashboard: {
        id: dashboard._id || dashboard.id,
        title: dashboard.title,
        schema: dashboard.schema,
        widgets: dashboard.widgets,
        layout: dashboard.layout,
        dataFilename: dashboard.dataFilename
      },
      data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
});

module.exports = router;
module.exports.memoryDB = memoryDB;
