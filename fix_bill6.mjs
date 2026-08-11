import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/modules/BillService.ts';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Remove specific duplicate/old keys and their values
const keysToRemove = ['file_url', 'ocr_data', 'status', 'total_amount'];
const toRemove = new Set();

for (let i = 220; i < lines.length; i++) {
    const line = lines[i];
    const keyMatch = line.match(/^\s+(\w+):/);
    if (keyMatch && keysToRemove.includes(keyMatch[1])) {
        toRemove.add(i);
        // Remove following value lines
        i++;
        while (i < lines.length && lines[i].trim() && !lines[i].match(/^\s+\w+:/)) {
            toRemove.add(i);
            i++;
        }
        continue;
    }
}

const filtered = lines.filter((_, idx) => !toRemove.has(idx));
fs.writeFileSync(path, filtered.join('\n'));
console.log('Removed old keys:', Array.from(toRemove).sort((a,b)=>a-b).map(i => lines[i].trim()));
