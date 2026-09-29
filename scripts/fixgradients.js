const fs = require('fs');
const cp = require('child_process');

const files = cp.execSync('grep -rl "bg-gradient-to-r from-primary to-primary-hover" src', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

let total = 0;
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  const before = c;
  c = c.split('bg-gradient-to-r from-primary to-primary-hover').join('bg-primary');
  c = c.split('bg-gradient-to-tr from-primary to-primary-hover').join('bg-primary');
  c = c.split('bg-gradient-to-r from-primary/20 to-primary-hover/20').join('bg-primary/20');
  c = c.split('bg-gradient-to-r from-primary to-ai').join('bg-primary');
  // Fix black text on black bg (invisible) -> white text
  c = c.split('bg-primary text-black').join('bg-primary text-white');
  if (c !== before) {
    fs.writeFileSync(f, c);
    total++;
    console.log('updated', f);
  }
}
console.log('total files updated:', total);