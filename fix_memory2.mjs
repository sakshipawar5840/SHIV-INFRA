import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/ai-engine/memory.ts';
let content = fs.readFileSync(path, 'utf8');

// Fix ConversationMessage interface
content = content.replace(
    `export interface ConversationMessage {

    id?: string;

    user_id: string;

    company_id: string;

    role: ConversationRole;

    message: string;

    channel: ConversationChannel;

    created_at?: string;

}`,
    `export interface ConversationMessage {

    id?: string;

    company_id: string;

    message: string;

    created_at?: string;

}`
);

// Fix saveConversation - use only valid columns
content = content.replace(
    `const { error } =
            await supabase
                .from("chat_history")
                .insert({

                    company_id: companyId,

                    phone: phone,

                    message: safeMessage,

                    sender: sender

                });`,
    `const { error } =
            await supabase
                .from("chat_history")
                .insert({

                    company_id: companyId,

                    message: safeMessage

                });`
);

// Fix getConversationHistory - use only valid columns
content = content.replace(
    `.select(\`
                    id,
                    user_id,
                    company_id,
                    role,
                    message,
                    channel,
                    created_at
                \`)
                .eq(
                    "user_id",
                    userId
                )
                .eq(
                    "company_id",
                    companyId
                )`,
    `.select(\`
                    id,
                    company_id,
                    message,
                    created_at
                \`)
                .eq(
                    "company_id",
                    companyId
                )`
);

// Fix getConversationHistory - remove role eq
content = content.replace(
    `.eq(
                    "role",
                    "USER"
                )`,
    ``
);

// Fix getLastUserMessage
content = content.replace(
    /export async function getLastUserMessage\(\n\s+userId: string,\n\s+companyId: string\n\s+\): Promise<ConversationMessage \| null> \{[\s\S]*?return data as ConversationMessage \| null;\n\s+\}\n\s+catch \(error\) \{[\s\S]*?return null;\n\s+\}\n\s+\}\n\n/,
    `export async function getLastUserMessage(\n    phone: string,\n    companyId: string\n): Promise<ConversationMessage | null> {\n\n    try {\n\n        const { data, error } =\n            await supabase\n                .from("chat_history")\n                .select(\`\n                    id,\n                    company_id,\n                    message,\n                    created_at\n                \`)\n                .eq(\n                    "company_id",\n                    companyId\n                )\n                .eq(\n                    "message",\n                    "CONFIRMED:"\n                )\n                .order(\n                    "created_at",\n                    {\n                        ascending: false\n                    }\n                )\n                .limit(1)\n                .maybeSingle();\n\n\n        if (error) {\n\n            console.error(\n                "[SHIVINFRA MEMORY] Last message fetch failed:",\n                error\n            );\n\n            return null;\n\n        }\n\n\n        return data as ConversationMessage | null;\n\n    }\n    catch (error) {\n\n        console.error(\n            "[SHIVINFRA MEMORY] Unexpected last message error:",\n            error\n        );\n\n        return null;\n\n    }\n\n}\n\n\n`
);

// Fix getLastAIMessage
content = content.replace(
    /export async function getLastAIMessage\(\n\s+userId: string,\n\s+companyId: string\n\s+\): Promise<ConversationMessage \| null> \{[\s\S]*?return data as ConversationMessage \| null;\n\s+\}\n\s+catch \(error\) \{[\s\S]*?return null;\n\s+\}\n\s+\}\n\n/,
    `export async function getLastAIMessage(\n    phone: string,\n    companyId: string\n): Promise<ConversationMessage | null> {\n\n    try {\n\n        const { data, error } =\n            await supabase\n                .from("chat_history")\n                .select(\`\n                    id,\n                    company_id,\n                    message,\n                    created_at\n                \`)\n                .eq(\n                    "company_id",\n                    companyId\n                )\n                .order(\n                    "created_at",\n                    {\n                        ascending: false\n                    }\n                )\n                .limit(1)\n                .maybeSingle();\n\n\n        if (error) {\n\n            console.error(\n                "[SHIVINFRA MEMORY] Last AI message fetch failed:",\n                error\n            );\n\n            return null;\n\n        }\n\n\n        return data as ConversationMessage | null;\n\n    }\n    catch (error) {\n\n        console.error(\n            "[SHIVINFRA MEMORY] Unexpected last AI message error:",\n            error\n        );\n\n        return null;\n\n    }\n\n}\n\n\n`
);

// Fix clearConversationHistory
content = content.replace(
    `.eq(
                    "user_id",
                    userId
                )
                .eq(
                    "company_id",
                    companyId
                )`,
    `.eq(
                    "company_id",
                    companyId
                )`
);

fs.writeFileSync(path, content);
console.log('Fixed memory.ts');
