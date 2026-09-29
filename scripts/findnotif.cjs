const fs = require('fs');
const path = require('path');
const dir = 'backend/routes';
const files = fs.readdirSync(dir);
for (const f of files) {
  const c = fs.readFileSync(path.join(dir, f), 'utf8');
  if (c.includes('notif') || c.includes('Notification')) console.log('NOTIF ROUTE FILE:', f);
}