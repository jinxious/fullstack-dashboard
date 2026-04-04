const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { matchColumns } = require('../utils/columnMatcher');
const router = express.Router();

let Template;
try {
  Template = require('../models/Template');
} catch (e) {
  console.log("Template model unavailable");
}

// In-memory fallback
const memoryTemplates = {};

// GET /api/templates — list user's templates
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (process.env.MONGODB_URI && Template) {
      const templates = await Template.find({ userId: req.user.id }).sort({ createdAt: -1 });
      return res.json({ success: true, templates });
    } else {
      const userTemplates = Object.values(memoryTemplates)
        .filter(t => t.userId === req.user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ success: true, templates: userTemplates });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
});

// POST /api/templates — create template from dashboard config
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, expectedColumns, widgets, layout } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Template name is required.' });
    }

    let id;
    if (process.env.MONGODB_URI && Template) {
      const template = new Template({
        userId: req.user.id,
        name,
        description: description || '',
        expectedColumns: expectedColumns || [],
        widgets: widgets || [],
        layout: layout || []
      });
      const saved = await template.save();
      id = saved._id.toString();
    } else {
      id = 'tmpl_' + Date.now();
      memoryTemplates[id] = {
        id, _id: id,
        userId: req.user.id,
        name,
        description: description || '',
        expectedColumns: expectedColumns || [],
        widgets: widgets || [],
        layout: layout || [],
        createdAt: new Date()
      };
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create template' });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (process.env.MONGODB_URI && Template) {
      const template = await Template.findById(req.params.id);
      if (!template) return res.status(404).json({ success: false, message: 'Not found' });
      if (template.userId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      await Template.findByIdAndDelete(req.params.id);
    } else {
      const template = memoryTemplates[req.params.id];
      if (!template) return res.status(404).json({ success: false, message: 'Not found' });
      if (template.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      delete memoryTemplates[req.params.id];
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete template' });
  }
});

// POST /api/templates/:id/apply — match uploaded schema against template
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const { uploadedSchema } = req.body; // Array of { name, type }

    if (!uploadedSchema || !Array.isArray(uploadedSchema)) {
      return res.status(400).json({ success: false, message: 'uploadedSchema is required.' });
    }

    let template;
    if (process.env.MONGODB_URI && Template) {
      template = await Template.findById(req.params.id);
    } else {
      template = memoryTemplates[req.params.id];
    }

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Run smart column matching
    const columnMappings = matchColumns(template.expectedColumns, uploadedSchema);

    const allAutoMatched = columnMappings.every(m => m.autoMatched);
    const hasPartialMatch = columnMappings.some(m => m.confidence > 0 && !m.autoMatched);

    res.json({
      success: true,
      template: {
        id: template._id || template.id,
        name: template.name,
        widgets: template.widgets,
        layout: template.layout,
        expectedColumns: template.expectedColumns
      },
      columnMappings,
      matchStatus: allAutoMatched ? 'full' : hasPartialMatch ? 'partial' : 'none'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to apply template' });
  }
});

// GET /api/templates/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    let template;
    if (process.env.MONGODB_URI && Template) {
      template = await Template.findById(req.params.id);
    } else {
      template = memoryTemplates[req.params.id];
    }

    if (!template) return res.status(404).json({ success: false, message: 'Not found' });
    if ((template.userId?.toString?.() || template.userId) !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, template });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch template' });
  }
});

module.exports = router;
