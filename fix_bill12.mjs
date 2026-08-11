import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/modules/BillService.ts';
let content = fs.readFileSync(path, 'utf8');

// Fix getBillById
content = content.replace(
    /async getBillById\(\s*\n\s*id:string,\s*\n\s*\n\s*\)\{/,
    'async getBillById(\n    id:string,\n    companyId:string\n){'
);
content = content.replace(
    /\.eq\(\s*\n\s*"company_id",\s*\n\s*company_id\s*\n\s*\)/,
    '.eq(\n            "company_id",\n            companyId\n        )'
);

// Fix updateBill
content = content.replace(
    /async updateBill\(\s*\n\s*\n\s*updateData:any\s*\n\s*\)\{/,
    'async updateBill(\n    id:string,\n    companyId:string,\n    updateData:any\n){'
);

// Fix updateOCRData
content = content.replace(
    /async updateOCRData\(\s*\n\s*\n\s*ocrData:any\s*\n\s*\)\{/,
    'async updateOCRData(\n    id:string,\n    companyId:string,\n    ocrData:any\n){'
);

// Fix deleteBill
content = content.replace(
    /async deleteBill\(\s*\n\s*\n\s*\)\{/,
    'async deleteBill(\n    id:string,\n    companyId:string\n){'
);

fs.writeFileSync(path, content);
console.log('Fixed BillService method signatures');
