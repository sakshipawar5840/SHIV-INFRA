// =====================================================
// SHIVINFRA AI CONTROLLER V15
// FINAL CLEAN PRODUCTION VERSION
// PART 1 / 3
//
// AI CHAT CONTROLLER
// CONTEXT ENGINE
// ACTION EXECUTOR
// MEMORY ENGINE
//
// Compatible:
// AIService V12+
// AIActionService V25
//
// =====================================================


import {
    Request,
    Response
} from "express";


import AIService from "../services/aiService.ts";

import AIActionService from "../services/aiActionService.ts";

import AIResponseService from "../services/aiResponseService.ts";

import { runAgent, AgentRequest } from "../ai-engine/agent";

import { detectIntent } from "../ai-engine/intentDetector";

import { askGemini, isAIAvailable } from "../services/ai/geminiClient.ts";

import { saveConversation, getConversationHistory, clearConversationHistory } from "../ai-engine/memory";


import crypto from "crypto";




// =====================================================
// DEFAULT COMPANY
// =====================================================


const DEFAULT_COMPANY_ID =
"3e9e9ae1-8593-473f-9aa3-9bcee469d795";





// =====================================================
// TYPES
// =====================================================


interface AIUserContext {

    id:string | null;

    company_id:string;


    role:
    |
    "ADMIN"
    |
    "ENGINEER"
    |
    "CUSTOMER"
    |
    "SALES";


    channel:
    |
    "WEB"
    |
    "WHATSAPP";

}





interface AIErrorResponse {

    success:boolean;

    code:string;

    message:string;

    request_id:string;

    timestamp:string;

}





// =====================================================
// REQUEST ID
// =====================================================


const generateRequestId = ():string => {

    return crypto.randomUUID();

};







// =====================================================
// ERROR RESPONSE
// =====================================================


const errorResponse = (

    code:string,

    message:string

):AIErrorResponse => {


    return {

        success:false,

        code,

        message,

        request_id:
        generateRequestId(),


        timestamp:
        new Date().toISOString()

    };

};








// =====================================================
// USER CONTEXT BUILDER
// =====================================================


const getUserContext = (

    req:Request

):AIUserContext => {



    const user:any = (req as any).user || {};



    const role = String(

        user.role || "ADMIN"

    ).toUpperCase();




    return {


        id:
        user.id || null,



        company_id:

        user.company_id ||

        DEFAULT_COMPANY_ID,




        role:

        (
            role === "ENGINEER"

            ||

            role === "CUSTOMER"

        )

        ?

        role as AIUserContext["role"]

        :

        "ADMIN",




        channel:

        req.body?.channel === "WHATSAPP"

        ?

        "WHATSAPP"

        :

        "WEB"


    };


};









// =====================================================
// MEMORY SAVE ENGINE
// =====================================================
const saveAIMemory = async(

    user:AIUserContext,

    data:any

)=>{

    try{



        const channel =
        user.channel === "WHATSAPP"
            ?
            "WHATSAPP"
            :
            "DASHBOARD";


        await saveConversation({

            userId:
            user.id || "unknown",

            companyId:
            user.company_id,

            phone:
            user.id
                ?
                `user-${user.id}`
                :
                undefined,

            role:
            "USER",

            message:
            data?.message || "",

            channel

        });



    }
    catch(error:any){



        console.error(

            "AI MEMORY SAVE ERROR",

            error.message

        );



    }


};
// =====================================================
// AI ACTION EXECUTOR
// =====================================================


const executeAIAction = async(

    intent:any,

    user:AIUserContext

)=>{


    try{

      const result =

await AIActionService.execute(

    intent.intent,

    intent.parameters || {},

    user

);



        return result;



    }

    catch(error:any){


        console.error(

            "AI ACTION EXECUTION ERROR",

            error.message

        );



        return {


            success:false,


            code:

            "ACTION_FAILED",



            message:

            error.message ||

            "Action execution failed"


        };


    }


};









// =====================================================
// AI CHAT CONTROLLER
//
// POST
// /api/v1/ai/chat
//
// =====================================================


export const aiChat = async(

    req:Request,

    res:Response

)=>{


    const startTime = Date.now();


    const requestId =
    generateRequestId();



    try{


        const {

            message,

            session_id

        } = req.body;



        if(!message?.trim()){


            return res

            .status(400)

            .json(

                errorResponse(

                    "MESSAGE_REQUIRED",

                    "Message required"

                )

            );


        }






        const user =

        getUserContext(req);





        console.log(

            "ðŸ¤– SHIVINFRA AI REQUEST",

            {

                requestId,

                message,

                user

            }

        );






        // =====================================================
        // AI AGENT PROCESSING
        // =====================================================


        const agentResponse =
        await runAgent({

            userId:
            user.id || "unknown",

            companyId:
            user.company_id,

            phone:
            user.id ? `user-${user.id}` : undefined,

            role:
            user.role as
            "ADMIN"
            |
            "CUSTOMER"
            |
            "ENGINEER"
            |
            "SALES",

            message,

            channel:
            "DASHBOARD"

        });



        const intent =
        agentResponse.intentResult
        || {

            intent:
            String(
                agentResponse.intentResult?.name
                ||
                agentResponse.intent
                ||
                "GENERAL_CHAT"
            )
            .trim()
            .toUpperCase(),

            confidence:
            0.9,

            parameters:
            {}

        };



        const action =
        agentResponse.data
        || {

            message:
            agentResponse.message

        };







        // =====================================================
        // RESPONSE GENERATION
        // =====================================================


        const responseText =
        agentResponse.message
        ||
        action?.message
        ||
        "Completed";










        // =====================================================
        // MEMORY
        // =====================================================
        // Note: saveConversation for USER and AI messages
        // is already handled inside runAgent().
        // No duplicate save needed here.










        return res.json({

            success:

            agentResponse.success,


            request_id:

            requestId,


            intent,


            action,


            response:

            responseText


        });





    }

    catch(error:any){



        console.error(

            "AI CHAT CONTROLLER ERROR",

            error

        );




        return res

        .status(500)

        .json(


            errorResponse(

                "AI_CHAT_FAILED",

                error.message ||

                "AI processing failed"

            )


        );



    }


};




// =====================================================
// PART 1 END
//
// NEXT:
// PART 2/3
//
// detectAIIntent
// WhatsApp AI Agent
// Security Layer
//
// =====================================================
// =====================================================
// SHIVINFRA AI CONTROLLER V15
// FINAL CLEAN PRODUCTION VERSION
// PART 2 / 3
//
// INTENT CONTROLLER
// WHATSAPP AI AGENT
// SECURITY ENGINE
//
// Compatible:
// AIService V12+
// AIActionService V25
//
// =====================================================







// =====================================================
// AI INTENT CONTROLLER
//
// POST
// /api/v1/ai/intent
//
// =====================================================


export const detectAIIntent = async(

    req:Request,

    res:Response

)=>{


    const startTime = Date.now();


    const requestId =
    generateRequestId();



    try{


        const {

            message

        } = req.body;




        if(!message?.trim()){


            return res

            .status(400)

            .json(

                errorResponse(

                    "MESSAGE_REQUIRED",

                    "Message required"

                )

            );


        }






        const user =

        getUserContext(req);





        console.log(

            "ðŸ§  INTENT REQUEST",

            {

                requestId,

                message,

                user

            }

        );







        // =====================================================
        // INTENT DETECTION
        // =====================================================



        const intent =

        await AIService.detectIntent(

            message,


            {

                company_id:

                user.company_id,


                user_id:

                user.id || undefined,


                role:

                user.role,


                channel:

                user.channel

            }

        );






        console.log(

            "AI DETECTED INTENT",

            intent

        );









        // =====================================================
        // ROLE BASE SECURITY
        // =====================================================



        const restrictedActions = [



            "ADD_PROJECT",

            "UPDATE_PROJECT",

            "DELETE_PROJECT",



            "ADD_CUSTOMER",

            "UPDATE_CUSTOMER",

            "DELETE_CUSTOMER",



            "ADD_EXPENSE",

            "UPDATE_EXPENSE",

            "DELETE_EXPENSE",



            "GENERATE_REPORT"



        ];







        if(


            user.role === "CUSTOMER"

            &&

            restrictedActions.includes(

                intent.intent

            )


        ){



            return res

            .status(403)

            .json({

                success:false,


                request_id:

                requestId,


                code:

                "PERMISSION_DENIED",


                message:

                "Customer cannot perform this action",


                intent


            });



        }









        // =====================================================
        // ACTION EXECUTION
        // =====================================================



        const action =

        await executeAIAction(

            intent,

            user

        );









        // =====================================================
        // RESPONSE GENERATION
        // =====================================================



        let finalResponse =

        action?.message ||

        "SHIVINFRA AI completed";




        try{


            const aiResponse =

            await AIResponseService.generate(

                intent.intent,

                action

            );



            finalResponse =

            aiResponse?.response ||

            finalResponse;



        }

        catch(error:any){


            console.error(

                "AI RESPONSE ERROR",

                error.message

            );


        }









        // =====================================================
        // MEMORY SAVE
        // =====================================================



        await saveAIMemory(

            user,


            {


                message,


                intent:

                intent.intent,


                confidence:

                intent.confidence || 0,



                parameters:

                intent.parameters || {},




                response:{


                    success:

                    action?.success !== false,


                    message:

                    finalResponse


                },




                execution_time:

                Date.now()-startTime



            }


        );









        return res.json({



            success:

            action?.success !== false,



            request_id:

            requestId,



            intent,



            action,



            response:

            finalResponse



        });






    }

    catch(error:any){



        console.error(

            "AI INTENT CONTROLLER ERROR",

            error.message

        );




        return res

        .status(500)

        .json(


            errorResponse(

                "INTENT_FAILED",

                error.message ||

                "Intent processing failed"

            )


        );


    }


};















// =====================================================
// WHATSAPP AI AGENT CONTROLLER
//
// CUSTOMER CHAT FLOW
//
// =====================================================


export const whatsappAIHandler = async(

    payload:any

)=>{


    const startTime = Date.now();




    try{


        const {


            message,


            company_id,


            user_id,


            session_id = "whatsapp"



        } = payload;








        if(!message?.trim()){



            return {


                success:false,


                code:

                "MESSAGE_REQUIRED",



                response:

                "Message required"



            };


        }








        const user:AIUserContext = {



            id:

            user_id || null,



            company_id:

            company_id ||

            DEFAULT_COMPANY_ID,




            role:

            "CUSTOMER",




            channel:

            "WHATSAPP"



        };







        console.log(

            "ðŸ“± WHATSAPP AI MESSAGE",

            {

                message,

                user

            }

        );









        // =====================================================
        // INTENT DETECTION
        // =====================================================



        const intent =

        await AIService.detectIntent(

            message,


            {


                company_id:

                user.company_id,


                user_id:

                user.id || undefined,


                role:

                user.role,


                channel:

                "WHATSAPP"


            }

        );









        // =====================================================
        // WHATSAPP SECURITY
        // =====================================================



        const blockedActions = [



            "ADD_PROJECT",

            "UPDATE_PROJECT",

            "DELETE_PROJECT",



            "ADD_CUSTOMER",

            "UPDATE_CUSTOMER",

            "DELETE_CUSTOMER",



            "ADD_EXPENSE",

            "UPDATE_EXPENSE",

            "DELETE_EXPENSE",



            "GENERATE_REPORT"



        ];







        if(

            blockedActions.includes(

                intent.intent

            )

        ){



            return {



                success:false,



                code:

                "ADMIN_ACTION_REQUIRED",



                intent:

                intent.intent,



                response:


                "âš  This action requires admin access."



            };


        }









        // =====================================================
        // ACTION EXECUTION
        // =====================================================



        let action:any = null;





        if(

            intent.intent !==

            "GENERAL_CHAT"

        ){



            action =

            await executeAIAction(

                intent,

                user

            );



        }









        // =====================================================
        // RESPONSE
        // =====================================================



        let responseText =

        action?.message ||

        "Thank you for contacting SHIVINFRA";






        try{


            const aiResponse =

            await AIResponseService.generate(

                intent.intent,

                action

            );



            responseText =

            aiResponse?.response ||

            responseText;



        }

        catch(error:any){


            console.error(

                "WHATSAPP RESPONSE ERROR",

                error.message

            );


        }









        // =====================================================
        // MEMORY
        // =====================================================



        await saveAIMemory(

            user,


            {


                session_id,


                message,



                intent:

                intent.intent,



                confidence:

                intent.confidence || 0,



                parameters:

                intent.parameters || {},



                response:{



                    success:

                    action?.success !== false,



                    message:

                    responseText



                },




                execution_time:

                Date.now()-startTime



            }



        );









        return {



            success:true,



            intent:

            intent.intent,



            action,



            response:

            responseText



        };






    }

    catch(error:any){



        console.error(

            "WHATSAPP AI ERROR",

            error.message

        );




        return {


            success:false,



            code:

            "WHATSAPP_AI_FAILED",



            response:

            "AI service temporarily unavailable"



        };


    }


};




// =====================================================
// PART 2 END
//
// NEXT:
// PART 3/3
//
// SIMPLE CHAT
// MEMORY APIs
// HEALTH
// STATUS
// FINAL EXPORT
//
// =====================================================
// =====================================================
// SHIVINFRA AI CONTROLLER
// PART 3 / 3
//
// SIMPLE CHAT
// MEMORY API
// HEALTH CHECK
// STATUS
// EXPORT
//
// =====================================================




// =====================================================
// SIMPLE AI CHAT
//
// POST
// /api/v1/ai/simple
//
// GENERAL CONVERSATION
//
// =====================================================


export const simpleAIChat = async(

    req:Request,

    res:Response

)=>{


    const startTime = Date.now();


    const requestId = generateRequestId();



    try{


        const {

            message,

            session_id="simple"

        } = req.body;





        if(!message?.trim()){


            return res

            .status(400)

            .json(

                errorResponse(

                    "MESSAGE_REQUIRED",

                    "Message required"

                )

            );


        }





        const user =

        getUserContext(req);





        console.log(

            "ðŸ’¬ SIMPLE AI CHAT",

            {

                requestId,

                message,

                user

            }

        );








        const response =

        await AIService.chat(


            message,


            {

                company_id:

                user.company_id,


                user_id:

                user.id || undefined,


                role:

                user.role,


                channel:

                user.channel


            }


        );








        await saveAIMemory(

            user,


            {

                session_id,


                message,


                intent:

                "GENERAL_CHAT",



                confidence:

                1,



                parameters:{},



                response:{


                    message:

                    response


                },



                execution_time:

                Date.now()-startTime


            }


        );







        return res.json({


            success:true,


            request_id:

            requestId,


            response


        });





    }

    catch(error:any){



        console.error(

            "SIMPLE CHAT ERROR",

            error.message

        );




        return res

        .status(500)

        .json(


            errorResponse(

                "SIMPLE_CHAT_FAILED",

                error.message ||

                "Chat failed"

            )


        );


    }


};









// =====================================================
// GET AI MEMORY
//
// GET
// /api/v1/ai/memory
//
// =====================================================


export const getAIMemory = async(


    req:Request,

    res:Response


)=>{


    try{


        const user =

        getUserContext(req);


        const memory =

        await getConversationHistory(

            user.company_id,

            50,

            user.id || undefined

        );







        return res.json({



            success:true,



            company_id:

            user.company_id,



            user_id:

            user.id,



            count:

            memory?.length || 0,



            data:

            memory || []



        });




    }

    catch(error:any){



        console.error(

            "GET MEMORY ERROR",

            error.message

        );




        return res

        .status(500)

        .json(


            errorResponse(

                "MEMORY_FETCH_FAILED",

                error.message ||

                "Memory fetch failed"

            )


        );


    }


};











// =====================================================
// CLEAR AI MEMORY
//
// DELETE
// /api/v1/ai/memory
//
// =====================================================


export const clearAIMemory = async(


    req:Request,

    res:Response


)=>{


    try{


        const user =

        getUserContext(req);





        await clearConversationHistory(

            user.company_id,

            user.id || "unknown"

        );







        return res.json({


            success:true,


            message:

            "AI memory cleared successfully"


        });




    }

    catch(error:any){



        console.error(

            "CLEAR MEMORY ERROR",

            error.message

        );




        return res

        .status(500)

        .json(


            errorResponse(

                "MEMORY_CLEAR_FAILED",

                error.message ||

                "Memory clear failed"

            )


        );


    }


};











// =====================================================
// AI HEALTH CHECK
//
// GET
// /api/v1/ai/health
//
// =====================================================


export const aiHealth = async(


    req:Request,

    res:Response


)=>{


    try{


        let actionHealth:any = {};




        try{


            actionHealth =

            typeof AIActionService.health ===
            "function"

                ?
            AIActionService.health()

                :

                {

                    status:
                        "ACTIVE",

                    service:
                        "SHIVINFRA AI ACTION SERVICE"

                };



        }

        catch(error:any){


            actionHealth = {


                status:

                "UNKNOWN",



                message:

                error.message



            };


        }







        return res.json({



            success:true,



            service:

            "SHIVINFRA AI CONTROLLER",



            status:

            "RUNNING",



            environment:

            "PRODUCTION",




            components:{



                intent_engine:

                "ACTIVE",



                action_engine:

                actionHealth.status ||

                "ACTIVE",



                memory_engine:

                "ACTIVE",



                whatsapp_agent:

                "ACTIVE"



            },







            features:[



                "Gemini Intent Detection",



                "AI Action Engine",



                "AI Memory",



                "Project AI CRUD",



                "Customer CRM AI",



                "Lead Automation",



                "Expense AI",



                "Bill OCR AI",



                "Report Engine",



                "WhatsApp AI Agent",



                "Permission Security"



            ],





            timestamp:

            new Date()



        });





    }

    catch(error:any){



        return res

        .status(500)

        .json(


            errorResponse(

                "HEALTH_FAILED",

                error.message ||

                "Health check failed"

            )


        );


    }


};











// =====================================================
// AI AGENT STATUS
//
// GET
// /api/v1/ai/status
//
// =====================================================


export const aiAgentStatus = async(


    req:Request,

    res:Response


)=>{



    return res.json({



        success:true,



        agent:

        "SHIVINFRA AI AGENT",




        status:

        "ACTIVE",




        production:

        true,




        channels:[


            "WEB",


            "WHATSAPP"


        ],




        engines:[


            "Gemini AI",


            "Intent Engine",


            "Action Engine",


            "Memory Engine",


            "Automation Engine"


        ],




        modules:[



            "Project Management AI",



            "Customer CRM AI",



            "Lead Management AI",



            "Expense Management AI",



            "Bill OCR AI",



            "Report Generation",



            "WhatsApp Automation",



            "AI Memory",



            "AI Security"



        ],




        timestamp:

        new Date()



    });



};











// =====================================================
// FINAL EXPORT
// =====================================================


export default {



    aiChat,


    detectAIIntent,


    whatsappAIHandler,


    simpleAIChat,


    getAIMemory,


    clearAIMemory,


    aiHealth,


    aiAgentStatus



};



// =====================================================
// END
// SHIVINFRA AI CONTROLLER
// =====================================================