import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/modules/BillService.ts';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Find createBill start and searchBills start
let createBillStart = -1;
let searchBillsStart = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('async createBill(')) createBillStart = i;
    if (lines[i].includes('async searchBills(')) {
        searchBillsStart = i;
        break;
    }
}

if (createBillStart === -1 || searchBillsStart === -1) {
    console.error('Could not find method boundaries');
    process.exit(1);
}

const newMethod = `async createBill(
    data:any
){


try{



    if(!data.company_id)
    {
        throw new Error(
            "Company id required"
        );
    }



    const duplicate =

    await this.checkDuplicateBill(
        data
    );



    if(duplicate)
    {
        return duplicate;
    }



    const now =

    new Date()
    .toISOString();



    const {

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

    data;



    const {
        data:bill,
        error
    }

    =

    await supabase

    .from("bills")

    .insert({

        company_id,

        vendor_name:
        vendor_name,

        material_name:
        material_name,

        quantity:
        quantity,

        unit:
        unit,

        bill_number:
        bill_number,

        bill_date:
        bill_date,

        amount:
        amount,

        gst_amount:
        gst_amount,

        bill_file_url:
        bill_file_url,

        ocr_text:
        ocr_text,

        payment_status:
        payment_status,

        remarks:
        remarks,

        project_id:
        project_id,

        vendor_id:
        vendor_id,

        created_at:
        created_at,

        updated_at:
        updated_at



    })

    .select()

    .single();



    if(error)
    {
        throw error;
    }



    return bill;



}
catch(error:any)
{



    console.error(

        "CREATE BILL ERROR:",

        error.message

    );



    throw error;



}



}`;

const before = lines.slice(0, createBillStart);
const after = lines.slice(searchBillsStart);
const result = [...before, ...newMethod.split('\n'), ...after];
fs.writeFileSync(path, result.join('\n'));
console.log('Replaced createBill method');
