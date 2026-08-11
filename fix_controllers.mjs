import fs from 'fs';

// Fix expenseController.ts
const expensePath = 'C:/Users/SP/Downloads/shiv-infra/backend/controllers/expenseController.ts';
let expenseContent = fs.readFileSync(expensePath, 'utf8');
expenseContent = expenseContent.replace(/expense_title:/g, 'description:');
expenseContent = expenseContent.replace(/req\.body\.expense_title \|\| ""/g, 'req.body.description || req.body.expense_title || ""');
expenseContent = expenseContent.replace(/expense_category:/g, 'category:');
expenseContent = expenseContent.replace(/req\.body\.expense_category \|\| ""/g, 'req.body.category || req.body.expense_category || ""');
expenseContent = expenseContent.replace(/payment_mode:/g, 'payment_method:');
expenseContent = expenseContent.replace(/req\.body\.payment_mode \|\| "Cash"/g, 'req.body.payment_method || req.body.payment_mode || "Cash"');
fs.writeFileSync(expensePath, expenseContent);
console.log('expenseController.ts updated');

// Fix billController.ts
const billPath = 'C:/Users/SP/Downloads/shiv-infra/backend/controllers/billController.ts';
let billContent = fs.readFileSync(billPath, 'utf8');
billContent = billContent.replace(/material_name:/g, 'material:');
billContent = billContent.replace(/req\.body\.material_name/g, 'req.body.material');
billContent = billContent.replace(/bill_number:/g, 'invoice_number:');
billContent = billContent.replace(/req\.body\.bill_number/g, 'req.body.invoice_number');
billContent = billContent.replace(/payment_status:/g, 'ocr_status:');
billContent = billContent.replace(/req\.body\.payment_status/g, 'req.body.ocr_status');
billContent = billContent.replace(/gst_amount:/g, 'gst_number:');
billContent = billContent.replace(/req\.body\.gst_amount/g, 'req.body.gst_number');
fs.writeFileSync(billPath, billContent);
console.log('billController.ts updated');
