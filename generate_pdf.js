const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, 'project_report.html');
  const pdfPath = path.resolve(__dirname, 'AI_Interview_System_Report.pdf');

  console.log(`📄 Loading report: ${htmlPath}`);
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0', timeout: 30000 });

  console.log('📝 Generating PDF...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size:8px; color:#999; width:100%; text-align:center; padding:5px 40px;">
        AI Interview System — Project Report &nbsp; | &nbsp; Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    `
  });

  await browser.close();
  console.log(`✅ PDF generated successfully: ${pdfPath}`);
})();
