// ======================================================
// SHIVINFRA AI AGENT
// INTENT ROUTER SERVICE
// Production Architecture
// ======================================================


import aiActionService from "./aiActionService";

import aiResponseService from "./aiResponseService";

const executeAIAction = aiActionService.execute?.bind(aiActionService) || (async () => ({}));

const generateAIResponse = aiResponseService.generate?.bind(aiResponseService) || (() => ({}));


// ======================================================
// MAIN ROUTER
// ======================================================

export async function routeIntent(
    intentData:any,
    user:any
){

    try{


        const {
            intent,
            entities
        } = intentData;



        console.log(
            "[AI ROUTER]",
            intent
        );



        // ===============================
        // DATABASE ACTION INTENTS
        // ===============================

        const databaseActions = [

            "ADD_PROJECT",
            "UPDATE_PROJECT",
            "DELETE_PROJECT",

            "ADD_CUSTOMER",
            "UPDATE_CUSTOMER",
            "DELETE_CUSTOMER",

            "ADD_LEAD",
            "UPDATE_LEAD",

            "ADD_EXPENSE",

            "UPLOAD_BILL",

            "GENERATE_REPORT"

        ];



        if(databaseActions.includes(intent)){


            const result =
            await executeAIAction(
                intentData,
                user
            );


            return generateAIResponse({
                success:true,
                intent,
                data:result
            });


        }




        // ===============================
        // SEARCH INTENTS
        // ===============================


        const searchActions=[


            "SEARCH_PROJECTS",
            "SEARCH_CUSTOMERS",
            "SEARCH_LEADS",
            "SEARCH_BILLS"

        ];



        if(searchActions.includes(intent)){


            const result =
            await executeAIAction(
                intentData,
                user
            );


            return generateAIResponse({

                success:true,
                intent,
                data:result

            });


        }




        // ===============================
        // GENERAL GPT MODE
        // ===============================


        return generateAIResponse({

            success:true,

            intent:"GENERAL_CHAT",

            message:
            intentData.message ||
            "How can I help you?"

        });



    }
    catch(error:any){


        console.error(
            "Intent Router Error",
            error
        );


        return {

            success:false,

            message:
            "AI processing failed",

            error:error.message

        };


    }

}