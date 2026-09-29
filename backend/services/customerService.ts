// =====================================================
// SHIVINFRA CUSTOMER SERVICE V12
// PRODUCTION CLEAN VERSION
//
// PART 1 / 5
//
// CORE ENGINE
// TYPES
// HELPERS
// VALIDATION
// CREATE CUSTOMER
// BASIC READ
//
// NO DUPLICATE METHODS
// CLASS CONTINUES
// =====================================================


import { supabaseAdmin as supabase } from "../config/supabase.ts";




// =====================================================
// TYPES
// =====================================================


interface CustomerCreateData {


    company_id:string;


    full_name?:string;

    name?:string;

    customer_name?:string;


    phone?:string;

    email?:string;


    city?:string;

    state?:string;

    pincode?:string;


    address?:string;


    budget?:number|string;


    interested_property_type?:string;

    requirement?:string;


    interested_location?:string;

    location_preference?:string;


    source?:string;

    lead_source?:string;


    status?:string;


    notes?:string;

    assigned_salesperson_id?:string;

    assigned_to?:string;


}



interface CustomerSearchParams {


    query?:string;

    phone?:string;

    city?:string;

    status?:string;

    budget?:number;


}





// =====================================================
// CUSTOMER SERVICE CLASS
// =====================================================


class CustomerService {



constructor(){


    console.log(

        "🚀 SHIVINFRA CUSTOMER SERVICE V12 READY"

    );


}






// =====================================================
// TEXT CLEANER
// =====================================================


private cleanText(

    text:string=""

):string{


    return String(text || "")

    .toLowerCase()

    .replace(

        /\b(show|find|search|get|customers|client|clients|list|all|update|edit|delete|remove|add|create)\b/gi,

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
// PHONE CLEANER
// =====================================================


private cleanPhone(

    phone:string=""

):string{


    return String(phone || "")

    .replace(

        /\D/g,

        ""

    )

    .slice(-10);


}







// =====================================================
// NAME RESOLVER
// =====================================================


private resolveCustomerName(

    data:CustomerCreateData

):string{


    return (

        data.full_name ||

        data.name ||

        data.customer_name ||

        ""

    )

    .trim();


}








// =====================================================
// VALIDATION
// =====================================================


private validateCustomer(

    customer:CustomerCreateData

){



    if(!customer.company_id){


        throw new Error(

            "Company ID required"

        );


    }




    const name =

    this.resolveCustomerName(customer);





    if(!name || name.length < 2){


        throw new Error(

            "Customer name required"

        );


    }


}









// =====================================================
// CREATE CUSTOMER
//
// ADMIN + AI CREATE
// =====================================================


async createCustomer(

    customer:CustomerCreateData

){


try{



    this.validateCustomer(customer);




    const phone =

    this.cleanPhone(

        customer.phone || ""

    );




    const customerName =

    this.resolveCustomerName(customer);






    // DUPLICATE CHECK


    if(phone){



        const {

            data:existing,

            error

        } = await supabase


        .from("customers")


        .select("id,full_name,phone")


        .eq(

            "company_id",

            customer.company_id

        )


        .eq(

            "phone",

            phone

        )


        .maybeSingle();





        if(error)

        throw error;





        if(existing){


            return {


                success:false,


                duplicate:true,


                message:

                "Customer already exists",


                data:existing


            };


        }


    }









    const now =

    new Date()

    .toISOString();








    const insertData:any = {
        company_id: customer.company_id,
        full_name: customerName || "Customer",
        phone: phone || null,
        email: customer.email || null,
        address: customer.address || null,
        city: customer.city || null,
        state: customer.state || null,
        pincode: customer.pincode || null,
        interested_location: customer.interested_location || customer.location_preference || null,
        interested_property_type: customer.interested_property_type || customer.requirement || null,
        budget: customer.budget ? String(customer.budget) : null,
        source: customer.source || "AI",
        status: customer.status || "active",
        notes: customer.notes || null,
        is_deleted: false,
        deleted_at: null,
        created_at: now,
        updated_at: now
    };









    const {

        data,

        error

    } = await supabase


    .from("customers")


    .insert(insertData)


    .select()


    .single();







    if(error)

    throw error;







    return {


        success:true,


        message:

        "Customer created successfully",


        data



    };





}
catch(error:any){



    console.error(

        "CREATE CUSTOMER ERROR:",

        error.message

    );



    throw error;



}



}












// =====================================================
// GET ALL CUSTOMERS
// =====================================================


async getCustomers(

    companyId:string

){



const {

    data,

    error

}= await supabase


.from("customers")


.select("*")


.eq(

    "company_id",

    companyId

)


.eq(

    "is_deleted",

    false

)


.order(

    "created_at",

    {

        ascending:false

    }

);







if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};





return data || [];

}












// =====================================================
// GET CUSTOMER BY ID
// =====================================================


async getCustomerById(

    id:string,

    companyId:string

){



const {

    data,

    error

}=await supabase


.from("customers")


.select("*")


.eq(

    "id",

    id

)


.eq(

    "company_id",

    companyId

)


.eq(

    "is_deleted",

    false

)


.maybeSingle();







if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};







return data || null;



}













// =====================================================
// GET CUSTOMER BY PHONE
// =====================================================


async getCustomerByPhone(

    companyId:string,

    phone:string

){



const cleanPhone =

this.cleanPhone(phone);






if(!cleanPhone)

return null;








const {

    data,

    error

}=await supabase


.from("customers")


.select("*")


.eq(

    "company_id",

    companyId

)


.eq(

    "phone",

    cleanPhone

)


.eq(

    "is_deleted",

    false

)


.maybeSingle();







if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};







return data || null;



}











// =====================================================
// PART 1 END
//
// NEXT PART 2/5
//
// SEARCH ENGINE
// SMART FINDER
// AI SEARCH
// CUSTOMER ID RESOLVER
// =====================================================
// =====================================================
// SHIVINFRA CUSTOMER SERVICE V12
// PRODUCTION CLEAN VERSION
//
// PART 2 / 5
//
// SEARCH ENGINE
// SMART FINDER
// AI SEARCH
// CUSTOMER ID RESOLVER
//
// CLASS CONTINUES
// =====================================================







// =====================================================
// FIND CUSTOMER BY PHONE
// =====================================================


async findCustomerByPhone(

    companyId:string,

    phone:string

){


try{


    const cleanPhone =

    this.cleanPhone(phone);





    if(!cleanPhone){


        return null;


    }







    const {

        data,

        error

    } = await supabase


    .from("customers")


    .select("*")


    .eq(

        "company_id",

        companyId

    )


    .eq(

        "phone",

        cleanPhone

    )


    .eq(

        "is_deleted",

        false

    )


    .maybeSingle();








    if(error)

    throw error;






    return data || null;



}
catch(error:any){



    console.error(

        "FIND CUSTOMER PHONE ERROR:",

        error.message

    );



    throw error;


}



}











// =====================================================
// FIND CUSTOMER BY NAME
// =====================================================


async findCustomerByName(

    companyId:string,

    name:string

){



try{



    const cleanName =

    this.cleanText(name);






    if(!cleanName){


        return null;


    }









    const {

        data,

        error

    } = await supabase


    .from("customers")


    .select("*")


    .eq(

        "company_id",

        companyId

    )


    .ilike(

        "full_name",

        `%${cleanName}%`

    )


    .eq(

        "is_deleted",

        false

    )


    .limit(1)


    .maybeSingle();








    if(error)

    throw error;








    return data || null;



}
catch(error:any){



    console.error(

        "FIND CUSTOMER NAME ERROR:",

        error.message

    );



    throw error;



}



}













// =====================================================
// GLOBAL CUSTOMER SEARCH
//
// SEARCH BY:
// NAME
// PHONE
// EMAIL
// CITY
// LOCATION
//
// AI FRIENDLY
// =====================================================


async searchCustomers(

    companyId:string,

    queryText:string=""

){


try{



    const search =

    this.cleanText(queryText);






    let query:any =

    supabase


    .from("customers")


    .select("*")


    .eq(

        "company_id",

        companyId

    )


    .eq(

        "is_deleted",

        false

    );



    if(search){


        query = query.or(

            [

                `full_name.ilike.%${search}%`,

                `phone.ilike.%${search}%`,

                `email.ilike.%${search}%`,

                `interested_location.ilike.%${search}%`,

                `interested_property_type.ilike.%${search}%`

            ]

            .join(",")


        );


    }










    const {

        data,

        error

    } = await query


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

        "SEARCH CUSTOMER ERROR:",

        error.message

    );



    throw error;



}



}












// =====================================================
// SMART CUSTOMER FINDER
//
// PRIORITY:
//
// 1. ID
// 2. PHONE
// 3. NAME
// 4. QUERY
//
// USED BY AI UPDATE / DELETE
// =====================================================


async smartFindCustomer(

    companyId:string,

    params:any

){



try{







    // DIRECT ID


    if(params.id){



        const customer =

        await this.getCustomerById(

            params.id,

            companyId

        );




        if(customer)

        return customer;



    }









    // PHONE SEARCH


    if(params.phone){



        const customer =

        await this.findCustomerByPhone(

            companyId,

            params.phone

        );





        if(customer)

        return customer;



    }









    // NAME SEARCH


    const name =


    params.full_name ||


    params.customer_name ||


    params.name;









    if(name){



        const customer =

        await this.findCustomerByName(

            companyId,

            name

        );






        if(customer)

        return customer;



    }









    // QUERY SEARCH


    if(params.query){



        const customers =

        await this.searchCustomers(

            companyId,

            params.query

        );







        if(customers.length > 0){



            return customers[0];



        }



    }









    return null;




}
catch(error:any){



    console.error(

        "SMART FIND CUSTOMER ERROR:",

        error.message

    );



    throw error;



}



}













// =====================================================
// AI CUSTOMER SEARCH
//
// EXAMPLES:
//
// Find Rahul
// Show customers Pune
// Search phone
//
// =====================================================


async aiSearchCustomers(

    companyId:string,

    params:any

){


try{







    // PHONE SEARCH


    if(params.phone){



        const customer =

        await this.findCustomerByPhone(

            companyId,

            params.phone

        );







        return customer

        ?

        [

            customer

        ]

        :

        [];



    }












    // NAME SEARCH


    if(

        params.name ||

        params.full_name ||

        params.customer_name

    ){



        const customer =

        await this.findCustomerByName(

            companyId,

            params.name ||

            params.full_name ||

            params.customer_name

        );








        return customer

        ?

        [

            customer

        ]

        :

        [];



    }









    // GENERAL SEARCH


    return await this.searchCustomers(

        companyId,

        params.query || ""

    );





}
catch(error:any){



    console.error(

        "AI SEARCH CUSTOMER ERROR:",

        error.message

    );



    throw error;



}



}












// =====================================================
// BULK SEARCH CUSTOMERS
//
// AI MULTI QUERY SUPPORT
//
// Example:
// ["Rahul","Pune","9876543210"]
// =====================================================


async bulkSearchCustomers(

    companyId:string,

    queries:string[]

){



try{



    const results:any[]=[];







    for(

        const query of queries

    ){



        const customers =

        await this.searchCustomers(

            companyId,

            query

        );






        results.push({



            query,


            count:

            customers.length,


            customers



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
// RESOLVE CUSTOMER ID
//
// USED BY:
// UPDATE
// DELETE
// AI ACTION ENGINE
// =====================================================


async resolveCustomerId(

    companyId:string,

    params:any

):Promise<string|null>{



try{





    if(params.id){


        return params.id;


    }









    const customer =

    await this.smartFindCustomer(

        companyId,

        params

    );









    if(customer){


        return customer.id;


    }









    return null;



}
catch(error:any){



    console.error(

        "RESOLVE CUSTOMER ID ERROR:",

        error.message

    );



    return null;



}



}











// =====================================================
// PART 2 END
//
// NEXT PART 3/5
//
// UPDATE CUSTOMER
// AI UPDATE
// SOFT DELETE
// RESTORE
// PERMANENT DELETE
// =====================================================
// =====================================================
// SHIVINFRA CUSTOMER SERVICE V12
// PRODUCTION CLEAN VERSION
//
// PART 3 / 5
//
// UPDATE ENGINE
// AI UPDATE
// SOFT DELETE
// RESTORE
// PERMANENT DELETE
//
// CLASS CONTINUES
// =====================================================







// =====================================================
// UPDATE CUSTOMER
//
// ADMIN + AI UPDATE
//
// Supports:
// - Direct ID
// - AI Name Resolver
// - Phone Validation
// =====================================================


async updateCustomer(

    id:string|null,

    companyId:string,

    updateData:any

){


try{



    let customerId = id;







    // AUTO RESOLVE ID


    if(!customerId){



        customerId =

        await this.resolveCustomerId(

            companyId,

            updateData

        );



    }







    if(!customerId){


        throw new Error(

            "Customer not found"

        );


    }









    const cleanData:any = {};









    // NAME UPDATE


    if(

        updateData.full_name ||

        updateData.name ||

        updateData.customer_name

    ){



        cleanData.full_name =


        updateData.full_name ||


        updateData.name ||


        updateData.customer_name;



    }









    // PHONE UPDATE


    if(updateData.phone){



        const phone =

        this.cleanPhone(

            updateData.phone

        );









        const {

            data:existing,

            error

        } = await supabase


        .from("customers")


        .select("id")


        .eq(

            "company_id",

            companyId

        )


        .eq(

            "phone",

            phone

        )


        .neq(

            "id",

            customerId

        )


        .maybeSingle();








        if(error)

        throw error;








        if(existing){


            throw new Error(

                "Phone already exists"

            );


        }








        cleanData.phone = phone;



    }













    // COMMON UPDATE FIELDS


    const allowedFields = [


        "email",

        "city",

        "state",

        "pincode",

        "address",

        "interested_property_type",

        "interested_location",

        "status",

        "notes"

    ];









    for(

        const field of allowedFields

    ){



        if(updateData[field] !== undefined){



            cleanData[field] =

            updateData[field];



        }



    }









    // BUDGET


    if(updateData.budget !== undefined){


        cleanData.budget =



        String(

            updateData.budget

        );



    }









    if(

        Object.keys(cleanData).length === 0

    ){



        throw new Error(

            "No update data provided"

        );



    }









    cleanData.updated_at =

    new Date()

    .toISOString();










const {

        data,

        error

    } = await supabase


    .from("customers")


    .update(cleanData)


    .eq(

        "id",

        customerId

    )


    .eq(

        "company_id",

        companyId

    )


    .select()


    .single();









    if(error)

    throw error;









    return {


        success:true,


        message:

        "Customer updated successfully",


        data



    };





}
catch(error:any){



    console.error(

        "UPDATE CUSTOMER ERROR:",

        error.message

    );



    throw error;



}



}













// =====================================================
// AI UPDATE CUSTOMER
//
// Example:
//
// Update Rahul budget 5000000
//
// =====================================================


async aiUpdateCustomer(

    companyId:string,

    params:any

){



    return await this.updateCustomer(

        null,

        companyId,

        params

    );



}














// =====================================================
// SOFT DELETE CUSTOMER
//
// Production CRM:
// Active
//   ↓
// Deleted
//   ↓
// Restore
//
// Data preserved
// =====================================================


async deleteCustomer(

    id:string|null,

    companyId:string,

    params:any={}

){


try{



    let customerId = id;







    if(!customerId){



        customerId =

        await this.resolveCustomerId(

            companyId,

            params

        );



    }








    if(!customerId){


        throw new Error(

            "Customer not found"

        );


    }









    const {

        data:customer,

        error:findError

    } = await supabase


    .from("customers")


    .select("id")


    .eq(

        "id",

        customerId

    )


    .eq(

        "company_id",

        companyId

    )


    .eq(

        "is_deleted",

        false

    )


    .maybeSingle();









    if(findError)

    throw findError;








    if(!customer){


        throw new Error(

            "Customer not found"

        );


    }









    const {

        data,

        error

    } = await supabase


    .from("customers")

.update({
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
})


    .eq(

        "id",

        customerId

    )


    .eq(

        "company_id",

        companyId

    )


    .select()


    .single();









    if(error)

    throw error;









    return {


        success:true,


        message:

        "Customer moved to recycle bin",


        data



    };





}
catch(error:any){



    console.error(

        "DELETE CUSTOMER ERROR:",

        error.message

    );



    throw error;



}



}












// =====================================================
// AI DELETE CUSTOMER
//
// Example:
//
// Delete Rahul customer
//
// =====================================================


async aiDeleteCustomer(

    companyId:string,

    params:any

){



    return await this.deleteCustomer(

        null,

        companyId,

        params

    );



}













// =====================================================
// RESTORE CUSTOMER
//
// Deleted -> Active
// =====================================================


async restoreCustomer(

    id:string,

    companyId:string

){



const {

    data,

    error

}=await supabase


.from("customers")


.update({



    status:"active",


    is_deleted:false,


    deleted_at:null,


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

return {

    success:false,

    message:

    "AI memory table not available"

};








return {


    success:true,


    message:

    "Customer restored successfully",


    data



};



}












// =====================================================
// GET DELETED CUSTOMERS
//
// RECYCLE BIN
// =====================================================


async getDeletedCustomers(

    companyId:string

){



const {

    data,

    error

}=await supabase


.from("customers")


.select("*")


.eq(

    "company_id",

    companyId

)


.eq(

    "is_deleted",

    true

)


.order(

    "deleted_at",

    {

        ascending:false

    }

);









if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};







return data || [];



}












// =====================================================
// PERMANENT DELETE
//
// ADMIN ONLY
//
// HARD DELETE
// =====================================================


async permanentDeleteCustomer(

    id:string,

    companyId:string

){



const {

    error

}=await supabase


.from("customers")


.delete()


.eq(

    "id",

    id

)


.eq(

    "company_id",

    companyId

);









if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};








return {


    success:true,


    message:

    "Customer permanently deleted"



};



}












// =====================================================
// PART 3 END
//
// NEXT PART 4/5
//
// FILTER ENGINE
// DASHBOARD ANALYTICS
// CUSTOMER ACTIVITY
// NOTES SYSTEM
// AI MEMORY
// =====================================================
// =====================================================
// SHIVINFRA CUSTOMER SERVICE V12
// PRODUCTION CLEAN VERSION
//
// PART 4 / 5
//
// FILTER ENGINE
// DASHBOARD ANALYTICS
// CUSTOMER ACTIVITY
// NOTES SYSTEM
// AI MEMORY ENGINE
//
// CLASS CONTINUES
// =====================================================







// =====================================================
// ADVANCED CUSTOMER FILTER ENGINE
//
// FILTER SUPPORT:
//
// CITY
// STATUS
// BUDGET RANGE
// PROPERTY TYPE
// LOCATION
// GLOBAL QUERY
//
// =====================================================


async filterCustomers(

    companyId:string,

    filters:any={}

){


try{



let query:any = supabase


.from("customers")


.select("*")


.eq(

    "company_id",

    companyId

)


.eq(

    "is_deleted",

    false

);









// CITY FILTER


if(filters.city){



    query = query.ilike(

        "city",

        `%${filters.city}%`

    );


}









// STATUS FILTER


if(filters.status){



    query = query.eq(

        "status",

        filters.status

    );


}









// MIN BUDGET


if(filters.min_budget !== undefined){



    query = query.gte(

        "budget",

        Number(filters.min_budget)

    );


}









// MAX BUDGET


if(filters.max_budget !== undefined){



    query = query.lte(

        "budget",

        Number(filters.max_budget)

    );


}









// PROPERTY TYPE


if(filters.interested_property_type){



    query = query.ilike(

        "interested_property_type",

        `%${filters.interested_property_type}%`

    );


}









// INTEREST LOCATION


if(filters.interested_location){



    query = query.ilike(

        "interested_location",

        `%${filters.interested_location}%`

    );


}









// GLOBAL SEARCH


if(filters.query){



    const search =

    this.cleanText(

        filters.query

    );





    query = query.or(



        [

            `full_name.ilike.%${search}%`,

            `phone.ilike.%${search}%`,

            `email.ilike.%${search}%`,

            `city.ilike.%${search}%`

        ]

        .join(",")



    );



}









const {

    data,

    error

}=await query


.order(

    "created_at",

    {

        ascending:false

    }

);









if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};








return {
        data: data || [],
        success: true
    };;





}
catch(error:any){



console.error(

    "FILTER CUSTOMER ERROR:",

    error.message

);



throw error;



}



}












// =====================================================
// CUSTOMER COUNT
// =====================================================


async countCustomers(

    companyId:string

){



const {

    count,

    error

}=await supabase


.from("customers")


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

)


.eq(

    "is_deleted",

    false

);









if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};









return count || 0;



}












// =====================================================
// ACTIVE CUSTOMER LIST
// =====================================================


async getActiveCustomers(

    companyId:string

){



const {

    data,

    error

}=await supabase


.from("customers")


.select("*")


.eq(

    "company_id",

    companyId

)


.eq(

    "status",

    "Active"

)


.eq(

    "is_deleted",

    false

)


.order(

    "created_at",

    {

        ascending:false

    }

);









if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};









return data || [];



}












// =====================================================
// RECENT CUSTOMERS
// =====================================================


async getRecentCustomers(

    companyId:string,

    limit:number=10

){



const {

    data,

    error

}=await supabase


.from("customers")


.select("*")


.eq(

    "company_id",

    companyId

)


.eq(

    "is_deleted",

    false

)


.order(

    "created_at",

    {

        ascending:false

    }

)


.limit(limit);









if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};









return data || [];



}












// =====================================================
// DASHBOARD CUSTOMER STATS
// =====================================================


async dashboardStats(

    companyId:string

){



const total =

await this.countCustomers(

    companyId

);








const active =

await this.getActiveCustomers(

    companyId

);








const recent =

await this.getRecentCustomers(

    companyId,

    5

);









return {



    totalCustomers:

    total,




    activeCustomers:

    active.length,




    recentCustomers:

    recent,




    generatedAt:

    new Date()



};



}












// =====================================================
// UPDATE CUSTOMER ACTIVITY
//
// LAST CONTACT TRACKING
// =====================================================


async updateCustomerActivity(

    id:string,

    companyId:string

){



const now =

new Date()

.toISOString();









const {

    data,

    error

}=await supabase


.from("customers")


.update({



    last_contacted_at:

    now,



    updated_at:

    now



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

return {

    success:false,

    message:

    "AI memory table not available"

};









return data;



}












// =====================================================
// ADD CUSTOMER NOTE
// =====================================================


async addCustomerNote(

    id:string,

    companyId:string,

    note:string

){



const {

    data,

    error

}=await supabase


.from("customers")


.update({



    notes:

    note,



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

return {

    success:false,

    message:

    "AI memory table not available"

};









return data;



}












// =====================================================
// SAVE AI MEMORY
//
// CUSTOMER CHAT MEMORY
//
// WhatsApp / Web AI
// =====================================================


async saveAIMemory(

    memory:any

){


try{



const {

    error

}=await supabase


.from("customer_ai_memory")


.insert({



    company_id:

    memory.company_id,




    customer_id:

    memory.customer_id,




    message:

    memory.message,




    intent:

    memory.intent || null,




    response:

    memory.response || null,




    channel:

    memory.channel || "WEB",




    created_at:

    new Date()

    .toISOString()



});









if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};









return {


    success:true,


    message:

    "AI memory saved"



};





}
catch(error:any){



console.error(

    "SAVE AI MEMORY ERROR:",

    error.message

);



return {

    success:false,

    message:

    "AI memory save failed"

};



}



}












// =====================================================
// GET AI MEMORY
// =====================================================


async getAIMemory(

    companyId:string,

    customerId:string

){



const {

    data,

    error

}=await supabase


.from("customer_ai_memory")


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


.limit(50);









if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};









return data || [];



}












// =====================================================
// PART 4 END
//
// NEXT PART 5/5
//
// AI MATCH ENGINE
// CUSTOMER ↔ PROJECT MATCH
// AUTO LEAD CREATION
// HEALTH CHECK
// FINAL EXPORT
// =====================================================
// =====================================================
// SHIVINFRA CUSTOMER SERVICE V12
// PRODUCTION CLEAN VERSION
//
// PART 5 / 5
//
// AI MATCH ENGINE
// CUSTOMER ↔ PROJECT MATCH
// AUTO LEAD CREATION
// HEALTH CHECK
// FINAL EXPORT
//
// FINAL CLASS CLOSE
// =====================================================






// =====================================================
// PROJECT MATCH FOR CUSTOMER
//
// CUSTOMER REQUIREMENT
//        ↓
// AI PROJECT RECOMMENDATION
//
// Uses:
// - Location
// - Budget
// - Property Type
//
// =====================================================


async recommendProjectsForCustomer(

    companyId:string,

    customer:any

){


try{



const {

    data:projects,

    error

}=await supabase


.from("projects")


.select("*")


.eq(

    "company_id",

    companyId

)


.neq(

    "status",

    "deleted"

);







if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};







const matches:any[]=[];







for(const project of projects || []){



    let score = 0;


    const reasons:string[]=[];







    // LOCATION MATCH


    if(

        customer.city &&

        project.city

    ){



        if(

            customer.city

            .toLowerCase()

            .includes(

                project.city

                .toLowerCase()

            )

        ){


            score += 30;


            reasons.push(

                "Location Match"

            );


        }


    }











    // BUDGET MATCH


    if(

        customer.budget &&

        project.price

    ){



        if(

            Number(customer.budget)

            >=

            Number(project.price)*0.8

        ){



            score += 40;


            reasons.push(

                "Budget Match"

            );


        }


    }











    // PROPERTY TYPE MATCH


    if(

        customer.interested_property_type &&

        project.project_type

    ){



        if(

            customer.interested_property_type

            .toLowerCase()

            .includes(

                project.project_type

                .toLowerCase()

            )

        ){



            score += 30;


            reasons.push(

                "Property Type Match"

            );


        }


    }










    if(score >= 50){



        matches.push({


            project_id:

            project.id,


            project_name:

            project.project_name,


            city:

            project.city,


            price:

            project.price,


            score,


            reasons



        });


    }



}








return matches.sort(

    (a,b)=>

    b.score-a.score

);




}
catch(error:any){



console.error(

    "PROJECT MATCH ERROR:",

    error.message

);



throw error;



}



}














// =====================================================
// CUSTOMER MATCH FOR PROJECT
//
// PROJECT
//    ↓
// FIND INTERESTED CUSTOMERS
//
// =====================================================


async recommendCustomersForProject(

    companyId:string,

    project:any

){


try{



const customers =

await this.getCustomers(

    companyId

);







const result:any[]=[];







for(const customer of customers){



    let score = 0;


    const reasons:string[]=[];










    // CITY MATCH


    if(

        project.city &&

        customer.city

    ){



        if(

            project.city

            .toLowerCase()

            .includes(

                customer.city

                .toLowerCase()

            )

        ){



            score +=30;


            reasons.push(

                "City Match"

            );


        }


    }









    // BUDGET MATCH


    if(

        customer.budget &&

        project.price

    ){



        if(

            Number(customer.budget)

            >=

            Number(project.price)*0.8

        ){



            score +=40;


            reasons.push(

                "Budget Compatible"

            );


        }


    }











    if(score >=50){



        result.push({



            customer_id:

            customer.id,


            customer_name:

            customer.full_name,


            phone:

            customer.phone,


            score,


            reasons



        });



    }




}








return result.sort(

    (a,b)=>

    b.score-a.score

);




}
catch(error:any){



console.error(

    "CUSTOMER MATCH ERROR:",

    error.message

);



throw error;



}



}












// =====================================================
// AUTO CREATE LEAD FROM AI MATCH
//
// AI Recommendation
//        ↓
// Automatic Lead
//
// =====================================================


async createLeadFromRecommendation(

    companyId:string,

    customerId:string,

    projectId:string

){



const {

    data,

    error

}=await supabase


.from("leads")


.insert({



    company_id:

    companyId,



    customer_id:

    customerId,



    project_id:

    projectId,



    lead_source:

    "AI_MATCH",



    status:

    "New",



    remarks:

    "Created automatically by SHIVINFRA AI Recommendation Engine"



})


.select()


.single();







if(error)

return {

    success:false,

    message:

    "AI memory table not available"

};








return {


    success:true,


    message:

    "AI lead created successfully",


    data



};



}











// =====================================================
// CUSTOMER HEALTH CHECK
//
// SYSTEM MONITORING
//
// =====================================================


health(){



return {



    service:

    "SHIVINFRA CUSTOMER SERVICE",





    version:

    "V12",





    status:

    "PRODUCTION READY",





    modules:[



        "CUSTOMER CRUD",


        "AI SEARCH ENGINE",


        "SMART CUSTOMER RESOLVER",


        "UPDATE ENGINE",


        "SOFT DELETE",


        "RESTORE SYSTEM",


        "RECYCLE BIN",


        "FILTER ENGINE",


        "DASHBOARD ANALYTICS",


        "CUSTOMER ACTIVITY",


        "AI MEMORY",


        "PROJECT MATCH ENGINE",


        "AUTO LEAD CREATION"



    ],





    timestamp:

    new Date()



};



}












// =====================================================
// FINAL CLASS CLOSE
// =====================================================


}



export default new CustomerService();


