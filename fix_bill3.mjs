import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/modules/BillService.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace the broken section
const broken = `        file_url:

        file_url || null,




        bill_file_url:

        file_url || null,




        ocr_data:

        ocr_data || null,




        ocr_text:

        ocr_data || null,




        status:

        status || "Pending",




        payment_status:

        status || "Pending",`;

const fixed = `        bill_file_url:

        file_url || null,




        ocr_text:

        ocr_data || null,




        payment_status:

        status || "Pending",`;

content = content.replace(broken, fixed);

// Fix the remaining broken lines
content = content.replace(
    /        ocr_data \|\| \{\},\n\n\n\n        status \|\| "pending",\n/g,
    ''
);

fs.writeFileSync(path, content);
console.log('Fixed');
