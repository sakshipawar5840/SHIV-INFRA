import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/modules/BillService.ts';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Remove duplicate lines 749-756 (0-indexed: 748-755)
const toRemove = new Set();
for (let i = 748; i < 756 && i < lines.length; i++) {
    toRemove.add(i);
}

const filtered = lines.filter((_, idx) => !toRemove.has(idx));
fs.writeFileSync(path, filtered.join('\n'));
console.log('Removed duplicate lines');
