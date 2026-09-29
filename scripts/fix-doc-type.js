const fs = require('fs');
const path = 'backend/controllers/documentController.ts';
let c = fs.readFileSync(path, 'utf8');
const oldStr = 'const allowedFields: (keyof DocumentService["update"]["arguments"][2])[] = ["filename", "project_id", "customer_id"];';
const newStr = 'const allowedFields: string[] = ["filename", "project_id", "customer_id"];';
if (c.includes(oldStr)) {
  c = c.replace(oldStr, newStr);
  fs.writeFileSync(path, c);
  console.log('Replaced successfully');
} else {
  console.log('Old string not found');
  console.log('Line 98:', c.split('\n')[97]);
}
