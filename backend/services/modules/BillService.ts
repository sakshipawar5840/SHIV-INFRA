// ============================================
// SHIVINFRA AI ERP
// BILL SERVICE V2
// PRODUCTION BILL CRUD ENGINE
// AI + OCR READY
// ============================================


import { supabaseAdmin as supabase } from "../../config/supabase.ts";

import { GoogleService } from "../googleService.ts";



// ============================================
// BILL SERVICE CLASS
// ============================================


class BillService {


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



try {
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

    const material_name = data.material_name || data.material || "";

    const quantity = data.quantity || null;

    const unit = data.unit || null;

    const bill_number = data.bill_number || data.invoice_number || "";

    const bill_date = data.bill_date || new Date().toISOString().split("T")[0];

    const amount = Number(data.amount) || 0;

    const gst_amount = Number(data.gst_amount || data.gst_number || 0) || 0;

    const bill_file_url = data.bill_file_url || data.file_url || data.original_file_url || null;

    const ocr_text = data.ocr_text || data.ocr_data || null;

    const payment_status = data.payment_status || data.status || "Pending";

    const remarks = data.remarks || null;
    const project_id = data.project_id || null;

    const uploaded_by = data.uploaded_by || null;



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

        payment_status:
        payment_status,

        ocr_text:
        ocr_text,

        remarks:
        remarks,

        project_id:
        project_id,

        uploaded_by:
        uploaded_by,

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



    if (bill) {

        const spreadsheetId =
            process.env.GOOGLE_SHEETS_BILLS_SPREADSHEET_ID;

        if (spreadsheetId) {

            GoogleService.appendSheetRows(
                spreadsheetId,
                "Sheet1!A:E",
                [[
                    bill_date,
                    project_id || "",
                    material_name,
                    quantity ? String(quantity) : "",
                    amount ? String(amount) : ""
                ]]
            ).catch((sheetError) => {
                console.error("[SHIVINFRA BILL] Google Sheets sync failed:", sheetError);
            });

        }

    }



    return bill;



}
catch(error:any) {



    console.error(

        "CREATE BILL ERROR:",

        error.message

    );



    throw error;



}



}



async searchBills(
    company_id: string,
    query: string = ""
): Promise<any[]> {


    try {


        const q =
            String(query || "")
                .trim();


        const monthMap: Record<number, string> = {
            0: "January",
            1: "February",
            2: "March",
            3: "April",
            4: "May",
            5: "June",
            6: "July",
            7: "August",
            8: "September",
            9: "October",
            10: "November",
            11: "December"
        };


        const monthNames =
            Object.values(monthMap);


        const monthPattern =
            new RegExp(
                `\\b(${monthNames.join("|")})\\b`,
                "i"
            );


        const yearMatch =
            q.match(/\b(20\d{2})\b/);


        const monthMatch =
            q.match(monthPattern);


        const lowerQ =
            q.toLowerCase();


        const now =
            new Date();


        const currentMonth =
            now.getMonth();


        const currentYear =
            now.getFullYear();


        let targetMonth:
            | number
            | null = null;


        let targetYear:
            | number
            | null = null;


        if (monthMatch) {


            const matchedMonth =
                monthMatch[1].charAt(0).toUpperCase() +
                monthMatch[1].slice(1).toLowerCase();


            targetMonth =
                monthNames.findIndex(
                    (m) => m === matchedMonth
                );


            if (targetMonth === -1) {


                targetMonth = null;

            }


        }


        if (yearMatch) {


            targetYear =
                parseInt(
                    yearMatch[1],
                    10
                );


        }


        if (
            lowerQ.includes("this month") ||
            lowerQ.includes("current month")
        ) {


            targetMonth =
                currentMonth;


            targetYear =
                currentYear;


        }


        else if (
            lowerQ.includes("last month")
        ) {


            targetMonth =
                currentMonth === 0
                    ? 11
                    : currentMonth - 1;


            targetYear =
                currentMonth === 0
                    ? currentYear - 1
                    : currentYear;


        }


        if (
            lowerQ.includes("this year") ||
            lowerQ.includes("current year")
        ) {


            targetYear =
                currentYear;


            targetMonth = null;


        }


        else if (
            lowerQ.includes("last year")
        ) {


            targetYear =
                currentYear - 1;


            targetMonth = null;


        }


        const projectMatch =
            q.match(
                /(?:project|proj)[:\s]+([A-Za-z0-9\s]+?)(?:\s+in\s+|\s+at\s+|\s+from\s+|\s+bill|\s+\d{4}|\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|$)/i
            );


        const vendorMatch =
            q.match(
                /(?:vendor|from|by)[:\s]+([A-Za-z0-9\s]+?)(?:\s+in\s+|\s+at\s+|\s+bill|\s+\d{4}|\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|$)/i
            );


        const invoiceMatch =
            q.match(
                /(?:invoice|bill)[:\s#]*([A-Za-z0-9\-/\\]+)/i
            );


        const materialMatch =
            q.match(
                /(?:cement|steel|sand|brick|aggregate|tiles|gravel|concrete|putty|material)[:\s]*([A-Za-z0-9\s]*?)(?:\s+in\s+|\s+at\s+|\s+bill|\s+\d{4}|$)/i
            );


        const materialExplicit =
            q.match(
                /\b(cement|steel|sand|brick|aggregate|tiles|gravel|concrete|putty)\b/i
            );


        let baseQuery =
            supabase
                .from("bills")
                .select(
                    "*, projects(project_name)"
                )
                .eq(
                    "company_id",
                    company_id
                )
                .order(
                    "bill_date",
                    { ascending: false }
                );


        if (
            targetMonth !==
            null &&
            targetYear !==
            null
        ) {


            const startDate =
                new Date(
                    targetYear,
                    targetMonth,
                    1
                );


            const endDate =
                new Date(
                    targetYear,
                    targetMonth + 1,
                    0,
                    23,
                    59,
                    59
                );


            baseQuery =
                baseQuery
                    .gte(
                        "bill_date",
                        startDate.toISOString().split("T")[0]
                    )
                    .lte(
                        "bill_date",
                        endDate.toISOString().split("T")[0]
                    );


        }


        else if (
            targetYear !==
            null
        ) {


            baseQuery =
                baseQuery
                    .gte(
                        "bill_date",
                        `${targetYear}-01-01`
                    )
                    .lte(
                        "bill_date",
                        `${targetYear}-12-31`
                    );


        }


        if (
            projectMatch &&
            projectMatch[1]
        ) {


            const projectName =
                projectMatch[1]
                    .trim();


            const { data: projects } =
                await supabase
                    .from("projects")
                    .select("id")
                    .eq(
                        "company_id",
                        company_id
                    )
                    .ilike(
                        "project_name",
                        `%${projectName}%`
                    )
                    .limit(1);


            if (
                projects &&
                projects.length >
                0
            ) {


                baseQuery =
                    baseQuery.eq(
                        "project_id",
                        projects[0].id
                    );


            }


        }


        if (
            vendorMatch &&
            vendorMatch[1]
        ) {


            baseQuery =
                baseQuery.ilike(
                    "vendor_name",
                    `%${vendorMatch[1].trim()}%`
                );


        }


        if (invoiceMatch && invoiceMatch[1]) {

            baseQuery =
                baseQuery.ilike(
                    "bill_number",
                    `%${invoiceMatch[1].trim()}%`
                );

        }


        if (materialExplicit) {

            baseQuery =
                baseQuery.ilike(
                    "material_name",
                    `%${materialExplicit[1]}%`
                );

        }


        else if (
            materialMatch &&
            materialMatch[1]
        ) {


            baseQuery =
                baseQuery.ilike(
                    "material_name",
                    `%${materialMatch[1].trim()}%`
                );


        }


        if (
            q &&
            !projectMatch &&
            !vendorMatch &&
            !invoiceMatch &&
            !materialExplicit &&
            !materialMatch &&
            targetMonth ===
            null &&
            targetYear ===
            null
        ) {


            baseQuery =
                baseQuery.or(
                    [
                        `vendor_name.ilike.%${q}%`,
                        `bill_number.ilike.%${q}%`,
                        `material_name.ilike.%${q}%`
                    ].join(",")
                );


        }


        const { data, error } =
            await baseQuery;


        if (error) {


            throw error;


        }


        return data || [];


    }
    catch (error: any) {


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
        companyId
    )

    .single();





    if(error)
    {
        throw error;
    }



    return data;



}
catch(error:any) {



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
        companyId
    )

    .select()

    .single();





    if(error)
    {
        throw error;
    }



    return data;



}
catch(error:any) {



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
        companyId
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
catch(error:any) {



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
            companyId
        )

        .select()

        .single();





    if(error)
    {
        throw error;
    }



    return data;



}
catch(error:any) {



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
