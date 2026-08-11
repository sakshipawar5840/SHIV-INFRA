// ============================================
// SHIVINFRA AI ERP
// BILL SERVICE V2
// PRODUCTION BILL CRUD ENGINE
// AI + OCR READY
// ============================================


import { supabaseAdmin as supabase } from "../../config/supabase.ts";




// ============================================
// BILL SERVICE CLASS
// ============================================


class BillService {




// ============================================
// CHECK DUPLICATE BILL
// ============================================


async checkDuplicateBill(
    data:any
){


    const {
        company_id,
        bill_number
    } = data;



    if(!bill_number)
    {
        return null;
    }



    const {
        data:existing,
        error
    }
    =
    await supabase

    .from("bills")

    .select("*")

    .eq(
            "company_id",
            company_id
        )

    .eq(
        "bill_number",
        bill_number
    )

    .maybeSingle();




    if(error)
    {
        throw error;
    }



    return existing || null;


}







// ============================================
// CREATE BILL
// ============================================


async createBill(
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



    const company_id = data.company_id;

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



    const created_at = now;

    const updated_at = now;



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



}
async searchBills(

    company_id:string,

    query:string=""

){


try{


    let request:any =


    supabase

    .from("bills")

    .select("*")

    .eq(
        "company_id",
        company_id
    )

    .order(

        "created_at",

        {
            ascending:false
        }

    );





    const search =

    query.trim();



    if(search)
    {

        request =

        request.or(

        [

            `vendor_name.ilike.%${search}%`,

            `bill_number.ilike.%${search}%`,

            `payment_status.ilike.%${search}%`

        ]

        .join(",")

        );


    }





    const {
        data,
        error
    }

    =
    await request;




    if(error)
    {
        throw error;
    }




    return data || [];



}
catch(error:any)
{

    console.error(

        "SEARCH BILL ERROR:",
        error.message

    );


    throw error;

}



}









// ============================================


async getBillById(
    id:string,
    companyId:string
){


try{


const {

    data,

    error

}

=

await supabase

.from("bills")

.select("*")

.eq(
    "id",
    id
)

.eq(
        "company_id",
        company_id
    )

.single();





if(error)
{
    throw error;
}



return data;



}
catch(error:any)
{

console.error(

"GET BILL ERROR:",

error.message

);


throw error;


}


}









// ============================================
// UPDATE BILL
// ============================================
async updateBill(
    id:string,
    companyId:string,
    updateData:any
){



    try{



        const cleanData = {



            ...updateData,



            updated_at:
            new Date()
            .toISOString()



        };


const {

    data,

    error

}

=

await supabase

.from("bills")

.update(

    cleanData

)

.eq(
    "id",
    id
)

.eq(
        "company_id",
        company_id
    )

.select()

.single();





if(error)
{
    throw error;
}




return data;



}
catch(error:any)
{


console.error(

"UPDATE BILL ERROR:",

error.message

);


throw error;


}



}









// ============================================
// DELETE BILL
// ============================================


async deleteBill(
    id:string,
    companyId:string
){


try{


const {

    data,

    error

}

=

await supabase

.from("bills")

.delete()

.eq(
    "id",
    id
)

.eq(
        "company_id",
        company_id
    )

.select();






if(error)
{
    throw error;
}




return {

    success:true,

    deleted:data

};



}
catch(error:any)
{


console.error(

"DELETE BILL ERROR:",

error.message

);


throw error;


}


}







// ============================================
// OCR BILL UPDATE
// ============================================


async updateOCRData(
    id:string,
    companyId:string,
    ocrData:any
){



    try{



        const {
            data,
            error
        } =

        await supabase

        .from("bills")

        .update({

            ocr_text:
            ocrData || {},

            updated_at:
            new Date()
            .toISOString()

        })

        .eq(
            "id",
            id
        )

        .eq(
            "company_id",
            company_id
        )

        .select()

        .single();







if(error)
{
    throw error;
}





return data;



}
catch(error:any)
{


console.error(

"OCR UPDATE ERROR:",

error.message

);


throw error;


}



}



}





// ============================================
// EXPORT
// ============================================


export default new BillService();