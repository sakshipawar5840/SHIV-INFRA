import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/modules/BillService.ts';
let content = fs.readFileSync(path, 'utf8');

// Remove duplicate properties by replacing the entire insert block
const oldBlock = `        total_amount:

        Number(total_amount)

        ||

        Number(amount)

        ||

        0,




        file_url:

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

const newBlock = `        bill_file_url:

        file_url || null,




        ocr_text:

        ocr_data || null,




        payment_status:

        status || "Pending",`;

content = content.replace(oldBlock, newBlock);

// Remove the second duplicate ocr_data and status block
const oldBlock2 = `        ocr_data:

        ocr_data || {},




        status:

        status || "pending",`;

const newBlock2 = ``;

content = content.replace(oldBlock2, newBlock2);

fs.writeFileSync(path, content);
console.log('BillService.ts fixed');
