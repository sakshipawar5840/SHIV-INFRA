// =====================================================
// SHIVINFRA LEAD SERVICE V12
// PRODUCTION AI CRM ENGINE
// PART 1 / 4
//
// CORE
// TYPES
// CREATE LEAD
// GET LEADS
// SEARCH ENGINE
//
// DATABASE MATCHED VERSION
// =====================================================


import { supabaseAdmin as supabase } from "../config/supabase.ts";




// =====================================================
// TYPES
// =====================================================


interface LeadCreateData {


    company_id:string;


    customer_id?:string | null;


    project_id?:string | null;


    lead_source?:string;


    requirement?:string | null;


    budget?:number | string | null;


    preferred_location?:string | null;


    status?:string;


    assigned_to?:string | null;


    remarks?:string | null;


}





interface LeadUpdateData {


    customer_id?:string | null;


    project_id?:string | null;


    lead_source?:string;


    requirement?:string | null;


    budget?:number | string | null;


    preferred_location?:string | null;


    status?:string;


    assigned_to?:string | null;


    remarks?:string | null;


}





// =====================================================
// CONSTANTS
// =====================================================


const VALID_LEAD_STATUS = [


    "New",


    "Follow Up",


    "Hot",


    "Closed",


    "Lost"


];








// =====================================================
// LEAD SERVICE V12
// =====================================================


class LeadService {





constructor(){


    console.log(

        "🚀 SHIVINFRA LEAD SERVICE V12 INITIALIZED"

    );


}









// =====================================================
// TEXT CLEANER
// AI SEARCH SUPPORT
// =====================================================


private cleanText(

    text:string = ""

):string{


    return String(text)


    .toLowerCase()


    .replace(

        /show|find|search|get|lead|leads|client|customer|list|all|create|add/gi,

        ""

    )


    .replace(

        /[^a-z0-9\s]/gi,

        ""

    )


    .replace(

        /\s+/g,

        " "

    )


    .trim();



}









// =====================================================
// VALIDATE STATUS
// =====================================================


private validateStatus(

    status:string

):string{


    if(

        !status ||

        !VALID_LEAD_STATUS.includes(status)

    ){

        return "New";

    }


    return status;


}









// =====================================================
// CREATE LEAD
// ADMIN + AI CREATE
// =====================================================


async createLead(

    lead:LeadCreateData

){


try{


    const now =

    new Date()

    .toISOString();





    const insertData: any = {


        company_id:

        lead.company_id,



        customer_id:

        lead.customer_id || null,



        project_id:

        lead.project_id || null,



        lead_source:

        lead.lead_source || "AI",



        requirement:

        lead.requirement || null,



        budget:

        lead.budget

        ?

        Number(lead.budget)

        :

        null,



        preferred_location:

        lead.preferred_location || null,



        status:

        this.validateStatus(

            lead.status || "New"

        ),






        remarks:

        lead.remarks || null,



        created_at:

        now,



        updated_at:

        now


    };







    const {

        data,

        error


    } = await supabase


    .from("leads")


    .insert(insertData)


    .select()


    .single();








    if(error)

    throw error;







    return data;



}
catch(error:any){



    console.error(

        "CREATE LEAD ERROR:",

        error.message

    );


    throw error;



}



}











// =====================================================
// GET ALL LEADS
// CUSTOMER + PROJECT JOIN
// =====================================================


async getLeads(

    companyId:string

){



const {

    data,

    error


}= await supabase


.from("leads")


.select(`

*,

customers(

id,

full_name,

phone,

email

),


projects(

id,

project_name,

location

)

`)


.eq(

    "company_id",

    companyId

)


.order(

    "created_at",

    {

        ascending:false

    }

);







if(error)

throw error;







return data || [];



}











// =====================================================
// GET LEAD BY ID
// =====================================================


async getLeadById(

    id:string,

    companyId:string

){



const {

    data,

    error


}= await supabase


.from("leads")


.select(`

*,

customers(

id,

full_name,

phone,

email

),


projects(

id,

project_name,

location

)

`)


.eq(

    "id",

    id

)


.eq(

    "company_id",

    companyId

)


.maybeSingle();







if(error)

throw error;







return data || null;



}











// =====================================================
// SEARCH LEADS
// AI SEARCH ENGINE
// =====================================================


async searchLeads(

    companyId:string,

    queryText:string=""

){



const search =

this.cleanText(queryText);





let query:any =


supabase


.from("leads")


.select(`

*,

customers(

id,

full_name,

phone

),


projects(

id,

project_name

)

`)


.eq(

    "company_id",

    companyId

)


.order(

    "created_at",

    {

        ascending:false

    }

);








if(search){



query = query.or(

[


`requirement.ilike.%${search}%`,


`preferred_location.ilike.%${search}%`,


`lead_source.ilike.%${search}%`,


`status.ilike.%${search}%`,


`remarks.ilike.%${search}%`


]


.join(",")


);



}







const {

    data,

    error


}= await query;








if(error)

throw error;







return data || [];



}











// =====================================================
// FIND LEAD BY CUSTOMER
// =====================================================


async findLeadByCustomer(

    companyId:string,

    customerId:string

){



const {

    data,

    error


}= await supabase


.from("leads")


.select("*")


.eq(

    "company_id",

    companyId

)


.eq(

    "customer_id",

    customerId

)


.order(

    "created_at",

    {

        ascending:false

    }

)


.limit(1)


.maybeSingle();







if(error)

throw error;







return data || null;



}









// =====================================================
// PART 1 END
//
// PART 2:
// UPDATE LEAD
// DELETE LEAD
// AI CRUD ENGINE
// =====================================================
// =====================================================
// SHIVINFRA LEAD SERVICE V12
// PRODUCTION AI CRM ENGINE
// PART 2 / 4
//
// UPDATE LEAD
// DELETE LEAD
// STATUS MANAGEMENT
// AI CRUD ENGINE
//
// DATABASE MATCHED VERSION
// =====================================================







// =====================================================
// RESOLVE LEAD ID
// AI UPDATE / DELETE SUPPORT
// =====================================================


async resolveLeadId(

    companyId:string,

    params:any

):Promise<string | null>{



try{


    // DIRECT ID SEARCH


    if(params.id){


        return params.id;


    }








    // CUSTOMER BASE SEARCH


    if(params.customer_id){



        const lead =

        await this.findLeadByCustomer(

            companyId,

            params.customer_id

        );



        if(lead)

        return lead.id;



    }









    // QUERY SEARCH


    if(params.query){



        const leads =

        await this.searchLeads(

            companyId,

            params.query

        );



        if(

            leads &&

            leads.length > 0

        ){


            return leads[0].id;


        }



    }








    return null;



}
catch(error:any){



    console.error(

        "RESOLVE LEAD ID ERROR:",

        error.message

    );


    return null;



}



}











// =====================================================
// UPDATE LEAD
// ADMIN + AI UPDATE
// =====================================================


async updateLead(

    id:string | null,

    companyId:string,

    updateData:LeadUpdateData & any

){



try{



let leadId = id;







// AUTO FIND LEAD


if(!leadId){


    leadId =

    await this.resolveLeadId(

        companyId,

        updateData

    );


}







if(!leadId){



    throw new Error(

        "Lead not found"

    );


}









const cleanData:any = {};










if(updateData.customer_id !== undefined){


    cleanData.customer_id =

    updateData.customer_id;


}








if(updateData.project_id !== undefined){


    cleanData.project_id =

    updateData.project_id;


}








if(updateData.lead_source !== undefined){


    cleanData.lead_source =

    updateData.lead_source;


}








if(updateData.requirement !== undefined){


    cleanData.requirement =

    updateData.requirement;


}








if(updateData.budget !== undefined){



    cleanData.budget =


    updateData.budget

    ?

    Number(updateData.budget)

    :

    null;



}








if(updateData.preferred_location !== undefined){


    cleanData.preferred_location =

    updateData.preferred_location;


}








if(updateData.status !== undefined){



    cleanData.status =

    this.validateStatus(

        updateData.status

    );


}








if(updateData.assigned_to !== undefined){


    cleanData.assigned_to =

    updateData.assigned_to;


}








if(updateData.remarks !== undefined){


    cleanData.remarks =

    updateData.remarks;


}









if(

Object.keys(cleanData).length === 0

){


    throw new Error(

        "No update fields provided"

    );


}








cleanData.updated_at =

new Date()

.toISOString();










const {

    data,

    error


}= await supabase


.from("leads")


.update(cleanData)


.eq(

    "id",

    leadId

)


.eq(

    "company_id",

    companyId

)


.select()


.single();









if(error)

throw error;









return data;



}
catch(error:any){



    console.error(

        "UPDATE LEAD ERROR:",

        error.message

    );


    throw error;



}



}











// =====================================================
// AI UPDATE LEAD
// =====================================================


async aiUpdateLead(

    companyId:string,

    params:any

){



return await this.updateLead(

    null,

    companyId,

    params

);



}











// =====================================================
// DELETE LEAD
// SAFE DELETE
// =====================================================


async deleteLead(

    id:string | null,

    companyId:string,

    params:any={}

){



try{



let leadId = id;







if(!leadId){



    leadId =

    await this.resolveLeadId(

        companyId,

        params

    );


}








if(!leadId){


    throw new Error(

        "Lead not found"

    );


}









// CHECK EXISTENCE


const {

    data:lead,

    error:findError


}= await supabase


.from("leads")


.select("id")


.eq(

    "id",

    leadId

)


.eq(

    "company_id",

    companyId

)


.maybeSingle();









if(findError)

throw findError;








if(!lead){


    throw new Error(

        "Lead not found"

    );


}









// DELETE


const {

    error


}= await supabase


.from("leads")


.delete()


.eq(

    "id",

    leadId

)


.eq(

    "company_id",

    companyId

);









if(error)

throw error;









return {


    success:true,


    message:

    "Lead deleted successfully",


    id:

    leadId



};



}
catch(error:any){



    console.error(

        "DELETE LEAD ERROR:",

        error.message

    );


    throw error;



}



}











// =====================================================
// AI DELETE LEAD
// =====================================================


async aiDeleteLead(

    companyId:string,

    params:any

){



return await this.deleteLead(

    null,

    companyId,

    params

);



}











// =====================================================
// CHANGE LEAD STATUS
// AI STATUS UPDATE
// =====================================================


async changeStatusByAI(

    companyId:string,

    params:any

){



try{



let leadId = params.id;







if(!leadId){



    leadId =

    await this.resolveLeadId(

        companyId,

        params

    );


}








if(!leadId){


    throw new Error(

        "Lead not found"

    );


}








const status =

this.validateStatus(

    params.status

);









const {

    data,

    error


}= await supabase


.from("leads")


.update({


    status,


    updated_at:

    new Date()

    .toISOString()


})


.eq(

    "id",

    leadId

)


.eq(

    "company_id",

    companyId

)


.select()


.single();









if(error)

throw error;








return data;



}
catch(error:any){



    console.error(

        "CHANGE STATUS ERROR:",

        error.message

    );


    throw error;



}



}











// =====================================================
// AI CRUD ENGINE
// INTENT ROUTER SUPPORT
// =====================================================













// =====================================================
// PART 2 END
//
// PART 3:
// ADVANCED FILTER
// DASHBOARD ANALYTICS
// AI SEARCH
// =====================================================
// =====================================================
// SHIVINFRA LEAD SERVICE V12
// PRODUCTION AI CRM ENGINE
// PART 3 / 4
//
// ADVANCED FILTER
// AI SEARCH ENGINE
// DASHBOARD ANALYTICS
// REPORT ENGINE
//
// DATABASE MATCHED VERSION
// =====================================================







// =====================================================
// ADVANCED LEAD FILTER ENGINE
// =====================================================


async filterLeads(

    companyId:string,

    filters:any = {}

){



try{



let query:any =


supabase


.from("leads")


.select(`

*,

customers(

id,

full_name,

phone,

email

),


projects(

id,

project_name,

location

)

`)



.eq(

"company_id",

companyId

);









// STATUS FILTER


if(filters.status){



query = query.eq(

"status",

filters.status

);



}









// LEAD SOURCE FILTER


if(filters.lead_source){



query = query.eq(

"lead_source",

filters.lead_source

);



}









// ASSIGNED USER FILTER


if(filters.assigned_to){



query = query.eq(

"assigned_to",

filters.assigned_to

);



}









// MINIMUM BUDGET


if(filters.min_budget){



query = query.gte(

"budget",

Number(filters.min_budget)

);



}









// MAXIMUM BUDGET


if(filters.max_budget){



query = query.lte(

"budget",

Number(filters.max_budget)

);



}









// LOCATION FILTER


if(filters.preferred_location){



query = query.ilike(

"preferred_location",

`%${filters.preferred_location}%`

);



}









// REQUIREMENT FILTER


if(filters.requirement){



query = query.ilike(

"requirement",

`%${filters.requirement}%`

);



}









// GENERAL AI SEARCH


if(filters.query){



const search =

this.cleanText(

filters.query

);





query = query.or(

[


`requirement.ilike.%${search}%`,


`preferred_location.ilike.%${search}%`,


`lead_source.ilike.%${search}%`,


`status.ilike.%${search}%`,


`remarks.ilike.%${search}%`


]


.join(",")

);



}









const {

data,

error

}

=

await query


.order(

"created_at",

{

ascending:false

}

);









if(error)

throw error;









return data || [];



}
catch(error:any){



console.error(

"FILTER LEADS ERROR:",

error.message

);



throw error;



}



}












// =====================================================
// GLOBAL AI SEARCH ENGINE
// =====================================================


async aiSearchLeads(

companyId:string,

params:any

){



try{





// CUSTOMER SEARCH


if(params.customer_id){



const lead =


await this.findLeadByCustomer(

companyId,

params.customer_id

);





return lead

?

[lead]

:

[];



}









// ADVANCED FILTER SEARCH


if(


params.status ||


params.lead_source ||


params.assigned_to ||


params.min_budget ||


params.max_budget ||


params.preferred_location ||


params.requirement



){



return await this.filterLeads(

companyId,

params

);



}









// NORMAL SEARCH


return await this.searchLeads(

companyId,

params.query || ""

);



}
catch(error:any){



console.error(

"AI SEARCH LEADS ERROR:",

error.message

);



throw error;



}



}












// =====================================================
// BULK SEARCH ENGINE
// =====================================================


async bulkSearchLeads(

companyId:string,

queries:string[]

){



try{



const results:any[]=[];









for(

const item of queries

){



const leads =


await this.searchLeads(

companyId,

item

);





results.push({



query:item,


count:leads.length,


leads



});



}









return results;



}
catch(error:any){



console.error(

"BULK SEARCH ERROR:",

error.message

);



throw error;



}



}












// =====================================================
// COUNT TOTAL LEADS
// =====================================================


async countLeads(

companyId:string

){



const {

count,

error

}

=

await supabase


.from("leads")


.select(

"id",

{

count:"exact",

head:true

}

)


.eq(

"company_id",

companyId

);









if(error)

throw error;









return count || 0;



}












// =====================================================
// ACTIVE LEADS
// =====================================================


async getActiveLeads(

companyId:string

){



const {

data,

error

}

=

await supabase


.from("leads")


.select("*")


.eq(

"company_id",

companyId

)


.not(

"status",

"eq.Closed"

)


.order(

"created_at",

{

ascending:false

}

);









if(error)

throw error;









return data || [];



}












// =====================================================
// RECENT LEADS
// =====================================================


async getRecentLeads(

companyId:string,

limit:number = 10

){



const {

data,

error

}

=

await supabase


.from("leads")


.select(`

*,


customers(

full_name,

phone

),


projects(

project_name

)

`)


.eq(

"company_id",

companyId

)


.order(

"created_at",

{

ascending:false

}

)


.limit(limit);









if(error)

throw error;









return data || [];



}












// =====================================================
// DASHBOARD ANALYTICS
// =====================================================


async dashboardStats(

companyId:string

){



const total =

await this.countLeads(

companyId

);









const active =

await this.getActiveLeads(

companyId

);









const recent =

await this.getRecentLeads(

companyId,

5

);









return {



totalLeads:

total,



activeLeads:

active.length,



closedLeads:

total - active.length,



recentLeads:

recent



};



}












// =====================================================
// LEAD STATUS REPORT
// =====================================================


async getLeadStatusReport(

companyId:string

){



const leads =

await this.getLeads(

companyId

);









const report:any = {};









for(

const lead of leads

){



const status =

lead.status || "Unknown";









if(!report[status]){



report[status]=0;



}









report[status]++;



}









return report;



}












// =====================================================
// MONTHLY LEAD REPORT
// =====================================================


async monthlyLeadCount(

companyId:string

){



const {

data,

error

}

=

await supabase


.from("leads")


.select(

"created_at"

)


.eq(

"company_id",

companyId

);









if(error)

throw error;









const months:any = {};









(data || []).forEach((lead:any)=>{



const month =


new Date(

lead.created_at

)


.toLocaleString(

"default",

{

month:"short"

}

);









months[month] =

(months[month] || 0) + 1;



});









return months;



}












// =====================================================
// PART 3 END
//
// PART 4:
// HEALTH
// DATABASE CHECK
// RESPONSE FORMAT
// FINAL EXPORT
// =====================================================
// =====================================================
// SHIVINFRA LEAD SERVICE V12
// PRODUCTION AI CRM ENGINE
// PART 4 / 4
//
// HEALTH ENGINE
// DATABASE CHECK
// RESPONSE FORMAT
// FINAL EXPORT
//
// DATABASE MATCHED VERSION
// =====================================================







// =====================================================
// CHECK LEAD EXISTS
// =====================================================


async checkLeadExists(

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


.from("leads")


.select(

"id"

)


.eq(

"id",

id

)


.eq(

"company_id",

companyId

)


.maybeSingle();









if(error)

throw error;









return !!data;



}
catch(error:any){



console.error(

"CHECK LEAD ERROR:",

error.message

);



throw error;



}



}












// =====================================================
// GET LEADS BY STATUS
// =====================================================


async getLeadsByStatus(

    companyId:string,

    status:string

){



const {

data,

error

}

=

await supabase


.from("leads")


.select(`

*,


customers(

full_name,

phone,

email

),


projects(

project_name,

location

)

`)


.eq(

"company_id",

companyId

)


.eq(

"status",

status

)


.order(

"created_at",

{

ascending:false

}

);









if(error)

throw error;









return data || [];



}












// =====================================================
// CHANGE STATUS BY AI
// =====================================================


async updateStatusByAI(

    companyId:string,

    params:any

){



try{



let leadId = params.id;









if(!leadId){



const lead =

await this.smartFindLead(

companyId,

params

);



if(lead){



leadId = lead.id;



}



}









if(!leadId){



throw new Error(

"Lead not found"

);



}









const status =

this.validateStatus(

params.status

);









const {

data,

error

}

=

await supabase


.from("leads")


.update({


status,


updated_at:

new Date()

.toISOString()


})


.eq(

"id",

leadId

)


.eq(

"company_id",

companyId

)


.select()


.single();









if(error)

throw error;









return data;



}
catch(error:any){



console.error(

"UPDATE STATUS AI ERROR:",

error.message

);



throw error;



}



}












// =====================================================
// AI LEAD ACTION ROUTER
// FINAL INTENT HANDLER
// =====================================================


async executeLeadAIAction(

    companyId:string,

    intent:string,

    parameters:any

){



try{



switch(intent){





case "ADD_LEAD":



return await this.createLead({


company_id:

companyId,


...parameters



});









case "SEARCH_LEADS":



return await this.aiSearchLeads(

companyId,

parameters

);









case "UPDATE_LEAD":



return await this.aiUpdateLead(

companyId,

parameters

);









case "DELETE_LEAD":



return await this.aiDeleteLead(

companyId,

parameters

);









case "CHANGE_LEAD_STATUS":



return await this.updateStatusByAI(

companyId,

parameters

);









default:



return {


success:false,


message:

"Unsupported lead intent"



};



}



}
catch(error:any){



console.error(

"AI LEAD ACTION ERROR:",

error.message

);



throw error;



}



}












// =====================================================
// SERVICE HEALTH
// =====================================================


health(){



return {



service:

"SHIVINFRA LEAD SERVICE",




version:

"V12",




status:

"RUNNING",




environment:

"PRODUCTION",




modules:[


"LEAD CREATE",


"LEAD SEARCH",


"LEAD UPDATE",


"LEAD DELETE",


"STATUS MANAGEMENT",


"AI CRUD ENGINE",


"FILTER ENGINE",


"DASHBOARD ANALYTICS"



],




timestamp:

new Date()



};



}












// =====================================================
// AI ENGINE HEALTH
// =====================================================


aiHealth(){



return {



engine:

"SHIVINFRA AI CRM ENGINE",




module:

"LEAD INTELLIGENCE",




status:

"ACTIVE",




capabilities:[


"ADD LEAD",


"SEARCH LEAD",


"UPDATE LEAD",


"DELETE LEAD",


"STATUS CHANGE",


"CUSTOMER LINKING",


"PROJECT LINKING"



],




timestamp:

new Date()



};



}












// =====================================================
// DATABASE HEALTH CHECK
// =====================================================


async databaseHealth(){



try{



const {

error

}

=

await supabase


.from("leads")


.select(

"id",

{

count:"exact",

head:true

}

);









if(error)

throw error;









return {



database:

"CONNECTED",




table:

"leads",




status:

"HEALTHY"



};



}
catch(error:any){



return {



database:

"FAILED",




status:

"ERROR",




message:

error.message



};



}



}












// =====================================================
// SUCCESS RESPONSE FORMAT
// =====================================================


successResponse(

    message:string,

    data:any = null

){



return {



success:true,



message,



data,



timestamp:

new Date()



};



}












// =====================================================
// ERROR RESPONSE FORMAT
// =====================================================


errorResponse(

    message:string,

    error:any = null

){



return {



success:false,



message,



error:

error?.message || error,



timestamp:

new Date()



};



}











// =====================================================
// FINAL END OF CLASS
// =====================================================


}









// =====================================================
// FINAL EXPORT
// =====================================================


export default new LeadService();


// =====================================================
// SHIVINFRA LEAD SERVICE V12 COMPLETE
// =====================================================