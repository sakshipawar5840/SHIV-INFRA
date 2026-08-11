import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/modules/BillService.ts';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Remove broken lines 309 and 314 (0-indexed: 308 and 313)
// Also remove the extra duplicate keys
const toRemove = [];
const seenKeys = new Set();

for (let i = 220; i < lines.length; i++) {
    const line = lines[i];
    const keyMatch = line.match(/^\s+(\w+):/);
    if (keyMatch) {
        const key = keyMatch[1];
        if (seenKeys.has(key)) {
            toRemove.push(i);
            // Also remove the value line(s) after it
            i++;
            while (i < lines.length && lines[i].trim() && !lines[i].match(/^\s+\w+:/)) {
                toRemove.push(i);
                i++;
            }
            continue;
        }
        seenKeys.add(key);
    }
}

// Remove from end to start to preserve indices
for (let i = toRemove.length - 1; i >= 0; i--) {
    lines.splice(toRemove[i], 1);
}

fs.writeFileSync(path, lines.join('\n'));
console.log('Removed duplicates, remaining lines to remove:', toRemove.length);
