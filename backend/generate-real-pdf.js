const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('real-test-tasks.pdf'));

doc.fontSize(20).text('Project Action Items', { underline: true });
doc.moveDown();

doc.fontSize(16).text('Task: Fix critical security vulnerability');
doc.fontSize(12).text('Description: Update the JWT library to version 5.0 and re-test refresh flow.');
doc.text('Priority: High');
doc.moveDown();

doc.fontSize(16).text('Task: Research new CVE-2024-54321');
doc.fontSize(12).text('Description: Check if our system is affected by this new overflow bug.');
doc.text('Priority: Medium');

doc.end();
console.log('Real PDF generated successfully.');
