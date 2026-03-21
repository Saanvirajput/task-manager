const fs = require('fs');

const content = `Task: Fix security vulnerability in auth module
Description: Update JWT library to version 5.0 and re-test refresh flows.
Priority: High

Task: Research new CVE-2024-54321
Description: Check if our system is affected by this new overflow bug.
Priority: Medium

1. Update frontend dependencies (Low)
2. Deploy final polish to production (High)
`;

// Simple PDF generation using a basic PDF structure
const pdfContent = \`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length \${content.length + 50} >>
stream
BT
/F1 12 Tf
50 700 Td
(\${content.replace(/\\n/g, ') Tj T* (')}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000223 00000 n 
0000000450 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
538
%%EOF\`;

fs.writeFileSync('tasks-to-import.pdf', pdfContent);
console.log('PDF created successfully.');
