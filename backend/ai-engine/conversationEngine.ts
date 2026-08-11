// =====================================================
// SHIVINFRA AI
// CONVERSATION ENGINE
//
// Purpose:
// - Handle general ChatGPT-style conversation
// - Use Gemini LLM when available
// - Fallback to static responses when LLM unavailable
// - Support English, Marathi, Hindi, Hinglish
// =====================================================

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

let aiClient: any = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
        aiClient = new GoogleGenAI({ apiKey });
    } catch (error) {
        console.error("[SHIVINFRA CONVERSATION] Gemini init failed:", error);
    }
}

export interface ConversationRequest {
    message: string;
    companyId: string;
    role: "ADMIN" | "CUSTOMER" | "ENGINEER" | "SALES";
    conversationHistory?: Array<{
        role: "user" | "assistant" | "system";
        content: string;
    }>;
}

export interface ConversationResponse {
    success: boolean;
    message: string;
    mode: "LLM" | "FALLBACK";
}

const FALLBACK_RESPONSES: Record<string, string> = {
    "hello": "Hello! 👋 I am SHIVINFRA AI. How can I help you today?",
    "hi": "Hi there! 👋 I am SHIVINFRA AI. How can I help you?",
    "good morning": "Good morning! ☀️ How can I assist you with SHIVINFRA today?",
    "good evening": "Good evening! 🌙 How can I help you?",
    "what can you do": "I can help you with:\n\n• Projects - search, add, update, delete\n• Customers - manage customer data\n• Leads - create and track leads\n• Expenses - add and track expenses\n• Bills - upload and manage bills\n• Reports - generate PDF/Excel reports\n• Site visits - schedule and manage\n\nJust ask me in English, Marathi, or Hindi!",
    "help": "I am your SHIVINFRA AI assistant. You can ask me about:\n\n• Projects in Pune/Mumbai\n• Prices and availability\n• Expenses and bills\n• Lead status\n• Site visits\n\nTry saying: 'Green Valley dakhav' or 'Pune madhye 2BHK project aahe ka?'",
};

function getFallbackResponse(message: string): string {
    const lower = message.toLowerCase().trim();
    
    for (const [key, response] of Object.entries(FALLBACK_RESPONSES)) {
        if (lower.includes(key)) {
            return response;
        }
    }
    
    return "I understand you're asking about something. For specific SHIVINFRA business queries, I can help you search projects, check prices, manage leads, and more. Could you please provide more details?";
}

export async function generateConversationResponse(
    request: ConversationRequest
): Promise<ConversationResponse> {
    const { message, companyId, role, conversationHistory = [] } = request;
    
    // If Gemini is available, use it for conversation
    if (aiClient) {
        try {
            const historyContext = conversationHistory
                .slice(-6)
                .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
                .join('\n');
            
            const prompt = `You are SHIVINFRA AI, a helpful assistant for a real estate and construction company in Pune, Maharashtra.

You help with:
- Project inquiries and details
- Prices and availability
- Lead management
- Expenses and bills
- Site visits
- General real estate questions

Support languages: English, Marathi, Hindi, Hinglish (mixed).

Be conversational, helpful, and concise. If the user asks about specific business data, guide them to use the appropriate commands.

User role: ${role}
Company ID: ${companyId}

${historyContext ? `Recent conversation:\n${historyContext}\n` : ''}
User: ${message}

Assistant:`;

            const response = await aiClient.models.generateContent({
                model: process.env.GEMINI_MODEL || "gemini-flash-latest",
                contents: prompt,
            });

            const text = response.text?.trim();
            
            if (text && text.length > 0) {
                return {
                    success: true,
                    message: text,
                    mode: "LLM"
                };
            }
        } catch (error) {
            console.error("[SHIVINFRA CONVERSATION] Gemini error:", error);
        }
    }
    
    // Fallback
    return {
        success: true,
        message: getFallbackResponse(message),
        mode: "FALLBACK"
    };
}
