const fs = require('fs');
const path = 'backend/services/leadService.ts';
let content = fs.readFileSync(path, 'utf8');
const target = '"Follow Up",';
if (!content.includes(target)) { console.log('Follow Up not found'); process.exit(1); }
if (content.includes('"Contacted",')) { console.log('Contacted already present'); process.exit(0); }
content = content.replace(target, '"Follow Up",\n\n    "Contacted",');
fs.writeFileSync(path, content);
console.log('Added "Contacted" to VALID_LEAD_STATUS.');
