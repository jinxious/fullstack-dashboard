const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Save to disk to bypass MongoDB 16MB limit for huge JSON datasets
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const router = express.Router();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Helper to infer type of column
const inferType = (value) => {
  if (value === null || value === undefined || value === '') return 'null';
  if (!isNaN(value) && value !== '') return 'number';
  if (typeof value === 'number' && value > 30000 && value < 60000) return 'date'; 
  if (typeof value === 'string' && !isNaN(Date.parse(value))) return 'date';
  return 'string';
};

const profileData = (data) => {
  if (!data || data.length === 0) return [];
  const headers = Object.keys(data[0]);
  const schema = headers.map(header => {
    const sample = data.slice(0, 100).map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');
    let type = 'string';
    if (sample.length > 0) {
      const types = sample.map(inferType);
      const isMostlyNumber = types.filter(t => t === 'number').length / types.length > 0.8;
      const isMostlyDate = types.filter(t => t === 'date').length / types.length > 0.8;
      if (isMostlyNumber) type = 'number';
      else if (isMostlyDate) type = 'date';
    }
    return { name: header, type };
  });
  return schema;
};

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = path.join(uploadDir, req.file.filename);
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: null });
    
    if (data.length === 0) {
      return res.status(400).json({ success: false, message: 'File is empty or invalid' });
    }

    const schema = profileData(data);

    res.json({
      success: true,
      message: 'File processed successfully',
      filename: req.file.filename,
      schema,
      data
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing file. Ensure it is a valid Excel or CSV file.'
    });
  }
});

module.exports = router;
