import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/ai-engine/memory.ts';
let content = fs.readFileSync(path, 'utf8');

// Fix getConversationHistory
content = content.replace(
    /\.select\(`\n\s+id,\n\s+user_id,\n\s+company_id,\n\s+role,\n\s+message,\n\s+channel,\n\s+created_at\n\s+`\)/g,
    `.select(\`\n                    id,\n                    company_id,\n                    phone,\n                    message,\n                    sender,\n                    created_at\n                \`)`
);

// Fix eq("user_id", userId) to eq("phone", phone)
content = content.replace(
    /\.eq\(\n\s+"user_id",\n\s+userId\n\s+\)/g,
    `.eq(\n                    "phone",\n                    phone\n                )`
);

// Fix eq("role", "USER") to eq("sender", "User")
content = content.replace(
    /\.eq\(\n\s+"role",\n\s+"USER"\n\s+\)/g,
    `.eq(\n                    "sender",\n                    "User"\n                )`
);

// Fix eq("role", "Agent") to eq("sender", "Agent")
content = content.replace(
    /\.eq\(\n\s+"role",\n\s+"Agent"\n\s+\)/g,
    `.eq(\n                    "sender",\n                    "Agent"\n                )`
);

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

    phone?: string;

    company_id: string;

    sender?: string;

    message: string;

    created_at?: string;

}`
);

// Fix function signatures to use phone instead of userId where appropriate
content = content.replace(
    /export async function getLastUserMessage\(\n\s+userId: string,\n\s+companyId: string\n\s+\)/g,
    `export async function getLastUserMessage(\n    phone: string,\n    companyId: string\n)`
);

content = content.replace(
    /export async function getLastAIMessage\(\n\s+userId: string,\n\s+companyId: string\n\s+\)/g,
    `export async function getLastAIMessage(\n    phone: string,\n    companyId: string\n)`
);

fs.writeFileSync(path, content);
console.log('Fixed memory.ts column names');
