import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/modules/BillService.ts';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '    await supabase\n\n    .from("bills")\n\n    .insert({';
const endMarker = '    })\n\n    .select()\n\n    .single();';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx + endMarker.length);
    
    const newInsert = `    await supabase

    .from("bills")

    .insert({


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
        bill_number || "",


        bill_date:
        bill_date ||
        new Date()
        .toISOString()
        .split("T")[0],


        amount:
        Number(amount) || 0,


        gst_amount:
        Number(gst_amount) || 0,


        bill_file_url:
        file_url || null,


        ocr_text:
        ocr_data || null,


        payment_status:
        status || "Pending",


        remarks:
        data.remarks || null,


        project_id:
        data.project_id || null,


        vendor_id:
        data.vendor_id || null,


        created_at:now,

        updated_at:now


    });`;

    content = before + newInsert + after;
    fs.writeFileSync(path, content);
    console.log('BillService.ts createBill fixed');
} else {
    console.error('Could not find markers');
}
