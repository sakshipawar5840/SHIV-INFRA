// =====================================================
// SHIVINFRA AI
// MEMORY ENGINE
//
// Production Conversation Memory
// Database: Supabase
// Actual chat_history columns: id, company_id, customer_id, user_type, message, ai_response, created_at
// =====================================================

import { supabaseAdmin as supabase } from "../config/supabase.ts";


// =====================================================
// TYPES
// =====================================================

export type ConversationRole =
    | "USER"
    | "AI"
    | "SYSTEM";


export type ConversationChannel =
    | "WHATSAPP"
    | "DASHBOARD";


export interface SaveConversationRequest {

    userId: string;

    companyId: string;

    phone?: string;

    role: ConversationRole;

    message: string;

    channel: ConversationChannel;

}


export interface ConversationMessage {

    id?: string;

    company_id: string;

    customer_id?: string | null;

    user_type?: string | null;

    message: string;

    ai_response?: string | null;

    created_at?: string;

}


// =====================================================
// CONFIGURATION
// =====================================================

const DEFAULT_MEMORY_LIMIT = 20;

const MAX_MESSAGE_LENGTH = 10000;


// =====================================================
// SAVE CONVERSATION
// =====================================================

export async function saveConversation(
    request: SaveConversationRequest
): Promise<void> {

    try {

        const companyId =
            String(request.companyId || "").trim();


        const message =
            String(request.message || "").trim();


        if (!companyId) {

            console.warn(
                "[SHIVINFRA MEMORY] Missing companyId",
                { phone: request.phone, userId: request.userId }
            );

            return;

        }


        if (!message) {

            return;

        }


        const safeMessage =
            message.slice(
                0,
                MAX_MESSAGE_LENGTH
            );

        const supabasePayload: any = {

            company_id: companyId,

            message: safeMessage

        };

        const { error: insertError } =
            await supabase
                .from("chat_history")
                .insert(supabasePayload);

        if(insertError){

            console.error(
                "[SHIVINFRA MEMORY] Save failed:",
                insertError
            );

            return;

        }
        else {

            console.log(
                "[SHIVINFRA MEMORY] Saved:",
                JSON.stringify(supabasePayload)
            );

        }


    }
    catch (error) {

        console.error(
            "[SHIVINFRA MEMORY] Unexpected save error:",
            error
        );

    }

}


// =====================================================
// GET CONVERSATION HISTORY
// =====================================================

export async function getConversationHistory(
    companyId: string,
    limit: number = DEFAULT_MEMORY_LIMIT,
    userId?: string
): Promise<ConversationMessage[]> {

    try {

        const safeLimit =
            Math.min(
                Math.max(
                    Number(limit) || DEFAULT_MEMORY_LIMIT,
                    1
                ),
                100
            );
        let query =
            supabase
                .from("chat_history")
                .select(`
                    id,
                    company_id,
                    customer_id,
                    user_type,
                    message,
                    ai_response,
                    created_at
                `)
                .eq(
                    "company_id",
                    companyId
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(safeLimit);


        let { data, error } =
            await query;


        if(error){

            console.error(
                "[SHIVINFRA MEMORY] History fetch failed:",
                error
            );

            return [];

        }


        const messages =
            Array.isArray(data)
                ? data
                : [];


        // Database gives newest first.
        // AI needs oldest → newest.

        return messages.reverse() as ConversationMessage[];

    }
    catch (error) {

        console.error(
            "[SHIVINFRA MEMORY] Unexpected history error:",
            error
        );

        return [];

    }

}


// =====================================================
// GET RECENT MEMORY
// =====================================================

export async function getRecentMemory(
    companyId: string,
    limit: number = 10
): Promise<ConversationMessage[]> {

    return getConversationHistory(
        companyId,
        limit
    );

}


// =====================================================
// BUILD AI CONTEXT
// =====================================================

export async function buildConversationContext(
    companyId: string,
    limit: number = DEFAULT_MEMORY_LIMIT
): Promise<string> {

    try {

        const history =
            await getConversationHistory(
                companyId,
                limit
            );


        if (!history.length) {

            return "";

        }


        const context =
            history
                .map(
                    (item) => {

                        return (
                            `${item.message}`
                        );

                    }
                )
                .join("\n");


        return context;

    }
    catch (error) {

        console.error(
            "[SHIVINFRA MEMORY] Context build failed:",
            error
        );

        return "";

    }

}


// =====================================================
// CLEAR USER MEMORY
// =====================================================

export async function clearConversationHistory(
    companyId: string,
    userId?: string
): Promise<boolean> {

    try {

        if(!companyId){

            return false;

        }


        let query =
            supabase
                .from("chat_history")
                .delete()
                .eq(
                    "company_id",
                    companyId
                );


        if(userId){

            query =
            query.eq(
                "user_id",
                userId
            );

        }


        const { error } =
            await query;


        if (error) {

            // Fallback: try without user_id filter (column may not exist)
            const { error: fallbackError } =
                await supabase
                    .from("chat_history")
                    .delete()
                    .eq(
                        "company_id",
                        companyId
                    );

            if(fallbackError){

                console.error(
                    "[SHIVINFRA MEMORY] Clear failed:",
                    fallbackError
                );

                return false;

            }

        }


        return true;

    }
    catch (error) {

        console.error(
            "[SHIVINFRA MEMORY] Unexpected clear error:",
            error
        );

        return false;

    }

}


// =====================================================
// GET LAST USER MESSAGE
// =====================================================

export async function getLastUserMessage(
    phone: string,
    companyId: string
): Promise<ConversationMessage | null> {

    try {

        let { data, error } =
            await supabase
                .from("chat_history")
                .select(`
                    id,
                    company_id,
                    user_id,
                    phone,
                    role,
                    channel,
                    message,
                    created_at
                `)
                .eq(
                    "company_id",
                    companyId
                )
                .eq(
                    "role",
                    "USER"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .maybeSingle();


        if(error){

            // Fallback: basic columns only
            const fallbackResult =
                await supabase
                    .from("chat_history")
                    .select(`
                        id,
                        company_id,
                        message,
                        created_at
                    `)
                    .eq(
                        "company_id",
                        companyId
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(1)
                    .maybeSingle();

            data = fallbackResult.data;
            error = fallbackResult.error;

        }


        if (error) {

            console.error(
                "[SHIVINFRA MEMORY] Last message fetch failed:",
                error
            );

            return null;

        }


        return data as ConversationMessage | null;

    }
    catch (error) {

        console.error(
            "[SHIVINFRA MEMORY] Unexpected last message error:",
            error
        );

        return null;

    }

}


// =====================================================
// GET LAST AI MESSAGE
// =====================================================

export async function getLastAIMessage(
    phone: string,
    companyId: string
): Promise<ConversationMessage | null> {

    try {

        let { data, error } =
            await supabase
                .from("chat_history")
                .select(`
                    id,
                    company_id,
                    user_id,
                    phone,
                    role,
                    channel,
                    message,
                    created_at
                `)
                .eq(
                    "company_id",
                    companyId
                )
                .eq(
                    "role",
                    "AI"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .maybeSingle();


        if(error){

            // Fallback: basic columns only
            const fallbackResult =
                await supabase
                    .from("chat_history")
                    .select(`
                        id,
                        company_id,
                        message,
                        created_at
                    `)
                    .eq(
                        "company_id",
                        companyId
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(1)
                    .maybeSingle();

            data = fallbackResult.data;
            error = fallbackResult.error;

        }


        if (error) {

            console.error(
                "[SHIVINFRA MEMORY] Last AI message fetch failed:",
                error
            );

            return null;

        }


        return data as ConversationMessage | null;

    }
    catch (error) {

        console.error(
            "[SHIVINFRA MEMORY] Unexpected last AI message error:",
            error
        );

        return null;

    }

}


// =====================================================
// HEALTH CHECK
// =====================================================

export async function checkMemoryHealth(): Promise<boolean> {

    try {

        const { error } =
            await supabase
                .from("chat_history")
                .select("id")
                .limit(1);


        if (error) {

            console.error(
                "[SHIVINFRA MEMORY] Health check failed:",
                error
            );

            return false;

        }


        return true;

    }
    catch (error) {

        console.error(
            "[SHIVINFRA MEMORY] Health check error:",
            error
        );

        return false;

    }

}
