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


            "UPLOAD_BILL",

            "ADD_EXPENSE",

            "SEARCH_PROJECTS",

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