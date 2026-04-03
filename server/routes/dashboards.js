const express = require('express');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const router = express.Router();

let Dashboard;
try {
  Dashboard = require('../models/Dashboard');
} catch (e) {
  console.log("Mongoose disabled");
}

// In-memory fallback if MONGODB_URI is not set
const memoryDB = {};

router.post('/', async (req, res) => {
  try {
    const { title, dataFilename, schema, widgets, layout } = req.body;
    
    let id;
    if (process.env.MONGODB_URI && Dashboard) {
      const newDash = new Dashboard({ title, dataFilename, schema, widgets, layout });
      const saved = await newDash.save();
      id = saved._id.toString();
    } else {
      id = 'dash_' + Date.now();
      memoryDB[id] = { id, title, dataFilename, schema, widgets, layout, createdAt: new Date() };
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to save dashboard' });
  }
});

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

    // Re-parse dataset to send to client
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

    res.json({
      success: true,
      dashboard: {
        title: dashboard.title,
        schema: dashboard.schema,
        widgets: dashboard.widgets,
        layout: dashboard.layout
      },
      data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
});

module.exports = router;
