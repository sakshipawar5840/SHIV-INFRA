import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/modules/BillService.ts';
let lines = fs.readFileSync(path, 'utf8').split('\n');

const filtered = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed !== 'ocr_data || {},' && trimmed !== 'status || "pending",';
});

fs.writeFileSync(path, filtered.join('\n'));
console.log('Removed broken lines');
