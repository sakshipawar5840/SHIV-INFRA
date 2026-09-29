const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/AICommandCenter.tsx',
  'src/pages/Customers.tsx',
  'src/pages/Bills.tsx',
  'src/pages/Documents.tsx',
  'src/pages/Expenses.tsx',
  'src/pages/InquirySpreadsheet.tsx',
  'src/pages/Inventory.tsx',
  'src/pages/Leads.tsx',
  'src/pages/Login.tsx',
  'src/pages/Projects.tsx',
  'src/pages/Reports.tsx',
  'src/pages/SiteVisits.tsx',
  'src/pages/Tasks.tsx',
  'src/pages/Users.tsx',
  'src/pages/Vendors.tsx',
  'src/components/Header.tsx',
];

let total = 0;
for (const f of files) {
  const p = path.join(__dirname, '..', f);
  if (!fs.existsSync(p)) { console.log('MISSING', f); continue; }
  let c = fs.readFileSync(p, 'utf8');
  const before = c;
  c = c.split('bg-gradient-to-r from-primary to-primary-hover').join('bg-primary');
  c = c.split('bg-gradient-to-tr from-primary to-primary-hover').join('bg-primary');
  c = c.split('bg-gradient-to-r from-primary/20 to-primary-hover/20').join('bg-primary/20');
  c = c.split('bg-gradient-to-r from-primary to-ai').join('bg-primary');
  c = c.split('bg-primary text-black').join('bg-primary text-white');
  if (c !== before) {
    fs.writeFileSync(p, c);
    total++;
    console.log('updated', f);
  }
}
console.log('total files updated:', total);