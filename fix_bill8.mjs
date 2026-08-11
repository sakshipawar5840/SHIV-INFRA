import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/modules/BillService.ts';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `    const {

        company_id,

        vendor_name:
        data.vendor_name || data.supplier || "",

        material_name:
        data.material_name || "",

        quantity:
        data.quantity || null,

        unit:
        data.unit || null,

        bill_number:
        data.bill_number || "",

        bill_date:
        data.bill_date ||
        new Date()
        .toISOString()
        .split("T")[0],

        amount:
        Number(data.amount) || 0,

        gst_amount:
        Number(data.gst_amount) || 0,

        bill_file_url:
        data.bill_file_url || data.file_url || null,

        ocr_text:
        data.ocr_text || data.ocr_data || null,

        payment_status:
        data.payment_status || data.status || "Pending",

        remarks:
        data.remarks || null,

        project_id:
        data.project_id || null,

        vendor_id:
        data.vendor_id || null,

        created_at:now,

        updated_at:now



    } =

    data;`;

const newBlock = `    const company_id = data.company_id;

    const vendor_name = data.vendor_name || data.supplier || "";

    const material_name = data.material_name || "";

    const quantity = data.quantity || null;

    const unit = data.unit || null;

    const bill_number = data.bill_number || "";

    const bill_date = data.bill_date || new Date().toISOString().split("T")[0];

    const amount = Number(data.amount) || 0;

    const gst_amount = Number(data.gst_amount) || 0;

    const bill_file_url = data.bill_file_url || data.file_url || null;

    const ocr_text = data.ocr_text || data.ocr_data || null;

    const payment_status = data.payment_status || data.status || "Pending";

    const remarks = data.remarks || null;

    const project_id = data.project_id || null;

    const vendor_id = data.vendor_id || null;`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(path, content);
console.log('Fixed destructuring in BillService');
