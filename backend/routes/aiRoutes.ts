// ============================================
// SHIVINFRA AI ROUTES V15
// FINAL PRODUCTION AI AGENT ROUTER
//
// WEB AI
// WHATSAPP AI
// MEMORY
// HEALTH
// STATUS
// ============================================



import { Router } from "express";



import {


    aiChat,


    detectAIIntent,


    whatsappAIHandler,


    simpleAIChat,


    getAIMemory,


    clearAIMemory,


    aiHealth,


    aiAgentStatus



} from "../controllers/aiController.ts";





import {


    authenticateJWT



} from "../middleware/auth.ts";






const router = Router();









// ============================================
// WEB AI CHAT
//
// POST
// /api/v1/ai/chat
//
// JWT REQUIRED
// ============================================


router.post(
"/chat",
authenticateJWT,
aiChat
);











// ============================================
// AI INTENT ENGINE TEST
//
// POST
// /api/v1/ai/intent
//
// JWT REQUIRED
// ============================================



router.post(

    "/intent",

    authenticateJWT,

    detectAIIntent

);











// ============================================
// SIMPLE AI CHAT
//
// GENERAL CONVERSATION
//
// POST
// /api/v1/ai/simple
//
// JWT REQUIRED
// ============================================



router.post(

    "/simple",

    authenticateJWT,

    simpleAIChat

);












// ============================================
// WHATSAPP AI WEBHOOK
//
// POST
// /api/v1/ai/whatsapp
//
// NO JWT
//
// Used by:
// Meta WhatsApp API
// Twilio
// WATI
// ============================================



router.post(

    "/whatsapp",

    async (req, res) => {

        try {

            const result =
            await whatsappAIHandler(req.body);

            return res
            .status(200)
            .json(result);

        }
        catch (error: any) {

            console.error(

                "WHATSAPP AI ROUTE ERROR:",

                error.message

            );

            return res
            .status(500)
            .json({

                success: false,

                code:
                "WHATSAPP_AI_FAILED",

                response:
                "AI service temporarily unavailable"

            });

        }

    }

);











// ============================================
// AI MEMORY FETCH
//
// GET
// /api/v1/ai/memory
//
// JWT REQUIRED
// ============================================



router.get(

    "/memory",

    authenticateJWT,

    getAIMemory

);












// ============================================
// CLEAR AI MEMORY
//
// DELETE
// /api/v1/ai/memory
//
// JWT REQUIRED
// ============================================



router.delete(

    "/memory",

    authenticateJWT,

    clearAIMemory

);












// ============================================
// AI HEALTH CHECK
//
// GET
// /api/v1/ai/health
//
// PUBLIC
// ============================================



router.get(

    "/health",

    aiHealth

);












// ============================================
// AI AGENT STATUS
//
// GET
// /api/v1/ai/status
//
// PUBLIC
// ============================================



router.get(

    "/status",

    aiAgentStatus

);













// ============================================
// AI PROVIDER STATUS
// GET /api/v1/ai/gemini-status
// PUBLIC - Shows 3-tier AI provider status (Gemini / OpenAI / fallback)
// ============================================


router.get(
    "/gemini-status",
    async (req: any, res: any) => {
        try {
            const { getAIProviderStatus } = await import("../ai-engine/intentDetector.ts");
            const status = getAIProviderStatus();

            return res.json({
                success: true,
                ai: {
                    ...status,
                    geminiModel: process.env.GEMINI_MODEL || "gemini-flash-latest",
                    openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini"
                },
                timestamp: new Date()
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Failed to get AI provider status",
                error: error.message
            });
        }
    }
);

// ============================================
// EXPORT ROUTER
// ============================================



export default router;