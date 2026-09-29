// =====================================================
// SHIVINFRA AI
// PERMISSION CHECKER ENGINE
// =====================================================



export interface PermissionRequest {


    role:
    | "ADMIN"
    | "CUSTOMER"
    | "ENGINEER"
    | "SALES";


    intent:string;


}



export interface PermissionResponse {


    allowed:boolean;


    reason:string;


}





// =====================================================
// PERMISSION ENGINE
// =====================================================


export async function checkPermission(
    request:PermissionRequest
):Promise<PermissionResponse>{



    const role =
    request.role.toUpperCase();



    const intent =
    request.intent.toUpperCase();





    // =================================================
    // ADMIN FULL ACCESS
    // =================================================


    if(role === "ADMIN"){


        return {


            allowed:true,


            reason:
            "Admin has full access"


        };


    }





    // =================================================
    // CUSTOMER ACCESS
    // =================================================


    if(role === "CUSTOMER"){



        const customerAllowed = [


            "SEARCH_PROJECTS",

            "SEARCH_CUSTOMERS",

            "ADD_LEAD",

            "BOOK_SITE_VISIT",

            "SEARCH_MATERIAL",

            "SEARCH_BILLS",

            "GENERAL_CHAT"



        ];





        if(
            customerAllowed.includes(intent)
        ){


            return {


                allowed:true,


                reason:
                "Customer permitted action"


            };


        }






        return {


            allowed:false,


            reason:
            "Customer cannot perform this action"


        };



    }





    // =================================================
    // ENGINEER ACCESS
    // =================================================


    if(role === "ENGINEER"){


        const engineerAllowed = [


            "SEARCH_PROJECTS",

            "ADD_LEAD",
            "SEARCH_LEADS",
            "UPDATE_LEAD",
            "DELETE_LEAD",

            "SEARCH_CUSTOMERS",

            "ADD_EXPENSE",
            "SEARCH_EXPENSES",
            "UPDATE_EXPENSE",
            "DELETE_EXPENSE",

            "UPLOAD_BILL",
            "SEARCH_BILLS",
            "UPDATE_BILL",
            "DELETE_BILL",

            "SEARCH_MATERIAL",

            "SEARCH_TASKS",
            "ADD_TASK",
            "UPDATE_TASK",
            "DELETE_TASK",

            "SEARCH_SITE_VISITS",
            "BOOK_SITE_VISIT",
            "UPDATE_SITE_VISIT",
            "DELETE_SITE_VISIT",

            "SEARCH_INVENTORY",
            "ADD_INVENTORY",
            "UPDATE_INVENTORY",
            "DELETE_INVENTORY",

            "SEARCH_VENDORS",
            "ADD_VENDOR",
            "UPDATE_VENDOR",
            "DELETE_VENDOR",

            "SEARCH_DOCUMENTS",
            "UPLOAD_DOCUMENT",
            "UPDATE_DOCUMENT",
            "DELETE_DOCUMENT",

            "GENERATE_REPORT",
            "GENERAL_CHAT"



        ];





        if(
            engineerAllowed.includes(intent)
        ){


            return {


                allowed:true,


                reason:
                "Engineer permitted action"


            };


        }





        return {


            allowed:false,


            reason:
            "Engineer restricted action"


        };



    }






    // =================================================
    // SALES ACCESS
    // =================================================


    if(role === "SALES"){



        const salesAllowed=[


            "SEARCH_PROJECTS",

            "ADD_LEAD",

            "SEARCH_LEADS",

            "BOOK_SITE_VISIT",

            "SEARCH_MATERIAL",

            "SEARCH_BILLS",

            "SEARCH_TASKS",

            "GENERATE_REPORT",

            "GENERAL_CHAT"



        ];





        if(
            salesAllowed.includes(intent)
        ){


            return {


                allowed:true,


                reason:
                "Sales permitted action"


            };


        }





        return {


            allowed:false,


            reason:
            "Sales restricted action"


        };


    }






    // =================================================
    // UNKNOWN ROLE
    // =================================================


    return {


        allowed:false,


        reason:
        "Invalid user role"


    };



}
