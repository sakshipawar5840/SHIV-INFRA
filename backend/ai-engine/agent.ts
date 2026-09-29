// =====================================================
// SHIVINFRA AI AGENT CORE
// Main AI Brain Controller
// =====================================================

import { detectIntent } from "./intentDetector";
import { checkPermission } from "./permissionChecker";
import { executeTool } from "./toolManager";
import { generateResponse } from "./responseGenerator";
import { saveConversation, getLastAIMessage, getConversationHistory as getDbConversationHistory } from "./memory";
import { ConfirmationService, ConfirmationPayload } from "../services/confirmationService";


// =====================================================
// TYPES
// =====================================================

export interface AgentRequest {

    userId: string;

    companyId: string;

    phone?: string;

    role:
    | "ADMIN"
    | "CUSTOMER"
    | "ENGINEER"
    | "SALES";

    message: string;

    channel:
    | "DASHBOARD"
    | "WHATSAPP";

}


export interface AgentResponse {

    success: boolean;

    intent?: string;

    intentResult?: any;

    message: string;

    data?: any;

    action?: string;

}


// =====================================================
// CONFIRMATION INTENTS
// =====================================================

const CONFIRMATION_REQUIRED = [

    "DELETE_PROJECT",

    "DELETE_CUSTOMER",

    "DELETE_LEAD",

    "DELETE_BILL",

    "DELETE_EXPENSE",

    "UPLOAD_BILL",

    "ADD_EXPENSE",

    "CREATE_BROADCAST",

    "UPDATE_PROJECT",

    "DELETE_TASK",

    "DELETE_SITE_VISIT",

    "DELETE_INVENTORY",

    "DELETE_VENDOR",

    "DELETE_DOCUMENT"

];


const CONFIRMATION_KEYWORDS = [

    "yes",

    "ha",

    "ho",

    "confirm",

    "ok",

    "proceed",

    "save",

    "send",

    "done",

    "y"

];


const CANCEL_KEYWORDS = [

    "no",

    "na",

    "cancel",

    "stop",

    "dont",

    "don't",

    "n"

];


const CONFIRMATION_TTL_MS = 30 * 60 * 1000;



const pendingConfirmations = new Map<string, any>();



const CONVERSATION_HISTORY_LIMIT = 10;



const conversationSessions = new Map<string, any[]>();



function getConfirmationKey(
    phone: string,
    companyId: string
): string {


    return (
        String(phone || "")
        + "|"
        + String(companyId || "")
    );


}



function getSessionKey(
    phone: string,
    companyId: string
): string {


    return (
        String(phone || "")
        + "|"
        + String(companyId || "")
    );


}



function getConversationHistory(
    phone: string,
    companyId: string
): any[] {


    const key =
        getSessionKey(
            phone,
            companyId
        );


    let history =
        conversationSessions.get(
            key
        ) || [];


    if (
        history.length === 0
    ) {

        getDbConversationHistory(
            companyId,
            20,
            phone
        ).then((dbHistory) => {

            if (
                Array.isArray(dbHistory) &&
                dbHistory.length > 0
            ) {

                const normalized =
                    dbHistory.map((item) => ({

                        message:
                            item.message,

                        role:
                            item.sender === "Agent"
                                ? "AI"
                                : item.sender === "System"
                                    ? "system"
                                    : "user",

                        timestamp:
                            item.created_at
                                ? new Date(
                                    item.created_at
                                ).getTime()
                                : Date.now()

                    }));


                conversationSessions.set(
                    key,
                    normalized
                );

                history =
                    normalized;

            }

        }).catch(() => {});

    }


    return history;

}



function appendToConversation(
    phone: string,
    companyId: string,
    message: string,
    role: string
): void {


    const key =
        getSessionKey(
            phone,
            companyId
        );


    const history =
        getConversationHistory(
            phone,
            companyId
        );


    history.push(
        {
            message,
            role,
            timestamp:
                Date.now()
        }
    );


    if (
        history.length >
        CONVERSATION_HISTORY_LIMIT
    ) {


        history.splice(
            0,
            history.length -
            CONVERSATION_HISTORY_LIMIT
        );


    }


    conversationSessions.set(
        key,
        history
    );


}



function extractLastProjectName(
    phone: string,
    companyId: string
): string | null {


    const history =
        getConversationHistory(
            phone,
            companyId
        );


    for (
        let i =
        history.length -
        1;
        i >=
        0;
        i--
    ) {


        const item =
            history[
                i
            ];


        if (
            item.role ===
            "AI" ||
            item.role ===
            "USER"
        ) {


            const projectMatch =
                item.message.match(
                    /([A-Za-z0-9\s]+?)\s+(cha|chi|la|le|ka|kay|ki)/i
                ) ||
                item.message.match(
                    /project[:\s]+([A-Za-z0-9\s]+)/i
                ) ||
                item.message.match(
                    /([A-Za-z0-9\s]+)\s+project/i
                );


            if (
                projectMatch &&
                projectMatch[
                    1
                ]
            ) {


                return projectMatch[
                    1
                ].trim();


            }


        }


    }


    return null;


}


// =====================================================
// MAIN AI AGENT FUNCTION
// =====================================================

export async function runAgent(
    request: AgentRequest
): Promise<AgentResponse> {
    let intent:any = null;




    try {




        console.log(
            "[SHIVINFRA AI] Incoming:",
            request.message
        );



        // -------------------------------------------------
        // 1. SAVE USER MESSAGE
        // -------------------------------------------------

        await saveConversation({

            userId: request.userId,

            companyId: request.companyId,

            phone: request.phone,

            role: "USER",

            message: request.message,

            channel: request.channel

        });


        appendToConversation(
            request.phone || request.userId,
            request.companyId,
            request.message,
            "USER"
        );



        // -------------------------------------------------
        // 2. CHECK FOR PENDING CONFIRMATION
        // -------------------------------------------------

        const confirmationKey =
            getConfirmationKey(
                request.phone || request.userId,
                request.companyId
            );

        const pendingConfirmation =
            await ConfirmationService.getPendingConfirmation(
                request.companyId,
                request.phone || request.userId
            );



        let pendingIntent: any = null;



        if(
            pendingConfirmation
        ){


            const userText =
            request.message
            .toLowerCase()
            .trim();



            const isConfirm =
            CONFIRMATION_KEYWORDS.some(
                (keyword) =>
                    userText === keyword ||
                    userText.startsWith(keyword + " ")
            );



            const isCancel =
            CANCEL_KEYWORDS.some(
                (keyword) =>
                    userText === keyword ||
                    userText.startsWith(keyword + " ")
            );



            if(isConfirm){



                // Mark as confirmed in persistent storage
                const confirmedConfirmation =
                    await ConfirmationService.confirmPending(
                        request.companyId,
                        request.phone || request.userId
                    );

                pendingIntent =
                    pendingConfirmation?.intent_data?.intent;



                if(pendingIntent){



                    await saveConversation({

                        userId: request.userId,

                        companyId: request.companyId,

                        phone: request.phone,

                        role: "SYSTEM",

                        message:
                        "CONFIRMED: " +
                        pendingIntent.name,

                        channel: request.channel

                    });

                    appendToConversation(
                        request.phone || request.userId,
                        request.companyId,
                        "CONFIRMED: " + pendingIntent.name,
                        "SYSTEM"
                    );



                    const result =
                    await executeTool({

                        intent: pendingIntent,

                        userId: request.userId,

                        companyId: request.companyId,

                        role: request.role,

                        phone: request.phone,

                        message: request.message,

                        conversationHistory:
                            getConversationHistory(
                                request.phone ||
                                request.userId,
                                request.companyId
                            ).map(item => ({
                                role: item.role === 'USER' ? 'user' : item.role === 'AI' ? 'assistant' : 'system',
                                content: item.message
                            }))

                    });



                    const response =
                    await generateResponse({

                        intent: pendingIntent,

                        result

                    });



                    await saveConversation({

                        userId: request.userId,

                        companyId: request.companyId,

                        phone: request.phone,

                        role: "AI",

                        message:
                        response.message +
                        " (Confirmed)",

                        channel: request.channel

                    });

                    appendToConversation(
                        request.phone || request.userId,
                        request.companyId,
                        response.message + " (Confirmed)",
                        "AI"
                    );



                    return {

                        success: true,

                        intent: pendingIntent.name,

                        intentResult: pendingIntent,

                        message: response.message,

                        data: result,

                        action: pendingIntent.action

                    };



                }



            }
            else if(isCancel){


                // Cancel in persistent storage
                await ConfirmationService.cancelPending(
                    request.companyId,
                    request.phone || request.userId
                );



                await saveConversation({

                    userId: request.userId,

                    companyId: request.companyId,

                    phone: request.phone,

                    role: "SYSTEM",

                    message:
                    "CANCELLED by user",

                    channel: request.channel

                });



                const cancelResponse: AgentResponse = {

                    success: true,

                    message:
                    "Action cancelled. Let me know if you need anything else."

                };



                await saveConversation({

                    userId: request.userId,

                    companyId: request.companyId,

                    phone: request.phone,

                    role: "AI",

                    message: cancelResponse.message,

                    channel: request.channel

                });

                appendToConversation(
                    request.phone || request.userId,
                    request.companyId,
                    cancelResponse.message,
                    "AI"
                );



                return cancelResponse;



            }
            else if(pendingConfirmation){

                // Clear expired/invalid confirmation
                await ConfirmationService.cancelPending(
                    request.companyId,
                    request.phone || request.userId
                );

            }

        } // end of pending confirmation check

        // -------------------------------------------------
        // 3. RESOLVE FOLLOW-UP CONTEXT
        // -------------------------------------------------

        let resolvedMessage = request.message;

        const lastProjectName =
            extractLastProjectName(
                request.phone ||
                request.userId,
                request.companyId
            );

        if (
            lastProjectName &&
            /^(tyacha|tyachi|tyache|tyala|its|his|her|their|the)\s+(price|details|info|availability|status|booking|cost|value)/i.test(
                request.message
            )
        ) {


            resolvedMessage =
                request.message +
                " for " +
                lastProjectName;

        }


        // -------------------------------------------------
        // 4. UNDERSTAND USER INTENT
        // -------------------------------------------------

        const intent2 =
        await detectIntent(
            resolvedMessage
        );




        intent =
        intent2;



        console.log(
            "[AI INTENT]",
            intent
        );



        // -------------------------------------------------
        // 4. CHECK USER PERMISSION
        // -------------------------------------------------

        const permission =
            await checkPermission({

                role: request.role,

                intent: intent.name

            });



        if(!permission.allowed){



            const deniedResponse: AgentResponse = {

                success:false,

                intent:intent.name,

                intentResult: intent,

                message:
                "You don't have permission to perform this action."

            };



            await saveConversation({

                userId: request.userId,

                companyId: request.companyId,

                phone: request.phone,

                role:"AI",

                message:
                deniedResponse.message,

                channel:request.channel

            });

            appendToConversation(
                request.phone || request.userId,
                request.companyId,
                deniedResponse.message,
                "AI"
            );



            return deniedResponse;

        }



        // -------------------------------------------------
        // 5. CHECK IF CONFIRMATION REQUIRED
        // -------------------------------------------------

        const needsConfirmation =
        CONFIRMATION_REQUIRED.includes(
            intent.name
        );



        if(needsConfirmation){



            const confirmationMessage =
            buildConfirmationMessage(
                intent,
                request.message
            );



            // Create persistent confirmation record
            const confirmationPayload: ConfirmationPayload = {
                intent,
                userId: request.userId,
                role: request.role,
                channel: request.channel,
                originalMessage: request.message,
            };

            await ConfirmationService.createConfirmation(
                request.companyId,
                request.phone || request.userId,
                confirmationPayload
            );



            await saveConversation({

                userId: request.userId,

                companyId: request.companyId,

                phone: request.phone,

                role: "AI",

                message: confirmationMessage,

                channel: request.channel

            });

            appendToConversation(
                request.phone || request.userId,
                request.companyId,
                confirmationMessage,
                "AI"
            );



            return {

                success: true,

                intent: intent.name,

                intentResult: intent,

                message: confirmationMessage,

                action: "CONFIRMATION_REQUIRED"

            };



        }



        // -------------------------------------------------
        // 6. EXECUTE BUSINESS TOOL
        // -------------------------------------------------

        const toolIntent =
            intent.name === "GENERAL_CHAT"
                ? {
                    ...intent,
                    parameters:
                    {
                        ...intent.parameters,
                        message:
                            request.message
                    }
                }
                : intent;

        const result =
            await executeTool({

                intent: toolIntent,

                userId:request.userId,

                companyId:request.companyId,

                role: request.role,

                phone: request.phone,

                message: request.message,

                conversationHistory:
                    getConversationHistory(
                        request.phone ||
                        request.userId,
                        request.companyId
                    ).map(item => ({
                        role: item.role === 'USER' ? 'user' : item.role === 'AI' ? 'assistant' : 'system',
                        content: item.message
                    }))

            });



        // -------------------------------------------------
        // 7. GENERATE AI RESPONSE
        // -------------------------------------------------

        const response =
            await generateResponse({

                intent,

                result

            });



        // -------------------------------------------------
        // 8. SAVE AI RESPONSE
        // -------------------------------------------------

        await saveConversation({

            userId:request.userId,

            companyId:request.companyId,

            phone:request.phone,

            role:"AI",

            message:
            response.message,

            channel:
            request.channel

        });

        appendToConversation(
            request.phone || request.userId,
            request.companyId,
            response.message,
            "AI"
        );



        return {

            success:true,

            intent:intent.name,

            intentResult: intent,

            message:
            response.message,

            data:
            result,

            action:
            intent.action

        };



    }
    catch(error:any){

        console.error(
            "[SHIVINFRA AI ERROR]",
            error
        );
        return {



            success:false,



            intent:intent?.name || "GENERAL_CHAT",



            intentResult: intent,



            message:
            error?.message ||
            "AI Agent failed to process request.",



        };
    }



}


// =====================================================
// BUILD CONFIRMATION MESSAGE
// =====================================================

function buildConfirmationMessage(
    intent: any,
    originalMessage: string
): string {


    const entity =
    String(intent.entity || "item")
    .toLowerCase();



    const name =
    extractEntityName(intent);



    let details = "";



    if(intent.name === "DELETE_PROJECT"){



        details =
        `Project: ${name}\n` +
        `Action: Delete / Soft-Delete\n\n`;



    }
    else if(intent.name === "UPLOAD_BILL"){



        const params = intent.parameters || {};



        details =
        `Vendor: ${params.vendor_name || params.vendor || "Unknown"}\n` +
        `Material: ${params.material_name || params.material || "Unknown"}\n` +
        `Amount: ${params.amount ? "₹" + Number(params.amount).toLocaleString("en-IN") : "Not specified"}\n` +
        `Bill No: ${params.bill_number || "Not specified"}\n\n` +
        `Save this bill?\n\n`;



    }
    else if(intent.name === "ADD_EXPENSE"){



        const params = intent.parameters || {};



        details =
        `Title: ${params.expense_title || params.title || "Expense"}\n` +
        `Amount: ${params.amount ? "₹" + Number(params.amount).toLocaleString("en-IN") : "Not specified"}\n` +
        `Category: ${params.expense_category || params.category || "General"}\n\n` +
        `Save this expense?\n\n`;



    }
    else if(intent.name === "UPDATE_PROJECT"){



        const params = intent.parameters || {};



        // Build preview of fields to be updated
        const updateFields = Object.entries(params)
            .filter(([key]) => key !== "project_name" && key !== "id" && key !== "project_id")
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");



        details =
        `Project: ${params.project_name || name || "Unknown"}\n` +
        `Fields to update:\n${updateFields || "None specified"}\n\n`;



    }
    else{



        details =
        `Entity: ${entity}\n` +
        `Action: ${intent.action}\n\n`;



    }



    return (
        `⚠️ Please confirm this action:\n\n` +
        details +
        `Reply YES to confirm or NO to cancel.`
    );



}


// =====================================================
// EXTRACT ENTITY NAME
// =====================================================

function extractEntityName(
    intent: any
): string {


    const params = intent.parameters || {};



    return (
        params.project_name ||
        params.name ||
        params.full_name ||
        params.customer_name ||
        params.vendor_name ||
        params.material_name ||
        params.expense_title ||
        params.title ||
        params.requirement ||
        "this item"
    );



}


// =====================================================
// EXTRACT PENDING INTENT FROM AI MESSAGE
// =====================================================

function extractPendingIntent(
    aiMessage: string
): any {


    // This is a simplified extraction.
    // In production, store the pending intent
    // in a dedicated confirmation table.



    const nameMatch =
    aiMessage.match(
        /Action:\s*(\w+)/i
    );



    const entityMatch =
    aiMessage.match(
        /Entity:\s*(\w+)/i
    );



    return {



        name:
        nameMatch ?
        nameMatch[1].toUpperCase() :
        "UNKNOWN",

        action:
        (nameMatch ?
            nameMatch[1] :
            "UNKNOWN"
        )
        .toUpperCase(),

        entity:
        entityMatch ?
        entityMatch[1].toUpperCase() :
        "UNKNOWN",

        parameters: {}



    };



}
