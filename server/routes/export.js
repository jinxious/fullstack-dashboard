const express = require('express');
const puppeteer = require('puppeteer');
const router = express.Router();

router.post('/pdf', async (req, res) => {
  try {
    const { htmlContent } = req.body;
    
    if (!htmlContent) {
      return res.status(400).json({ success: false, message: 'No HTML content provided' });
    }

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Using a simple wrapper to render the HTML. 
    // In a production app, the backend might navigate to the frontend URL to capture the exact layout + CSS.
    // For this MVP, we allow the frontend to render the payload HTML + Tailwind CSS CDN, or just inline.
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    await browser.close();

    res.contentType('application/pdf');
    res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
});

module.exports = router;
