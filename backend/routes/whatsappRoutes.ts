import { Router } from "express";

import whatsappWebhookService from "../services/whatsapp/WhatsappWebhookService.ts";

import WhatsAppApiController from "../controllers/whatsappApiController.ts";

import { authenticateJWT } from "../middleware/auth.ts";

import crypto from "crypto";

import fs from "fs";

import path from "path";


const whatsappRouter = Router();

const DEBUG_LOG_PATH = path.join(process.cwd(), "whatsapp-debug.log");

function debugLog(message: string, context?: Record<string, unknown>): void {
    try {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : "";
        fs.appendFileSync(DEBUG_LOG_PATH, `${timestamp} ${message}${contextStr}\n`);
    } catch (e) {
        // ignore
    }
}


function verifyXHubSignature(
    req: any,
    res: any,
    next: any
): void {

    const appSecret =
        process.env.META_WHATSAPP_APP_SECRET;

    if (!appSecret) {

        if (process.env.NODE_ENV === "production") {

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "WhatsApp webhook signature verification is not configured. META_WHATSAPP_APP_SECRET is required in production."

                });

        }

        console.warn("[SHIVINFRA WHATSAPP] META_WHATSAPP_APP_SECRET missing; signature validation skipped (development only).");
        return next();

    }


    const signature =
        req.headers["x-hub-signature-256"] as
            string | undefined;


    if (!signature) {

        return res
            .status(403)
            .json({

                success: false,

                message:
                    "Missing X-Hub-Signature"

            });

    }

    const payload: Buffer | string =
        req.rawBody && Buffer.isBuffer(req.rawBody)
            ? req.rawBody
            : JSON.stringify(req.body);

    const expectedSignature =
        "sha256=" +
        crypto
            .createHmac(
                "sha256",
                appSecret
            )
            .update(payload)
            .digest("hex");


    const sigA = Buffer.from(signature);
    const sigB = Buffer.from(expectedSignature);

    if (
        sigA.length !== sigB.length ||
        !crypto.timingSafeEqual(sigA, sigB)
    ) {

        return res
            .status(403)
            .json({

                success: false,

                message:
                    "Invalid signature"

            });

    }


    next();

}


whatsappRouter.get(
"/webhook",
(req,res)=>{


const mode = req.query["hub.mode"];

const token = req.query["hub.verify_token"];

const challenge = req.query["hub.challenge"];


if(
mode === "subscribe"
&&
token === process.env.META_WHATSAPP_VERIFY_TOKEN
){

return res.status(200)
.send(challenge);

}


return res.sendStatus(403);


});


whatsappRouter.post(
  "/webhook",
  verifyXHubSignature,
  async(req,res)=>{

    debugLog("WEBHOOK POST RECEIVED", {
      path: req.path,
      method: req.method,
      contentType: req.headers["content-type"],
    });

    try {

        const payload =
            req.body ||
            {};

        debugLog(`PAYLOAD: ${JSON.stringify(payload).slice(0, 200)}`, {
          object: payload?.object,
          entryCount: payload?.entry?.length,
        });

        res.status(200).send("OK");

        debugLog("STARTING BACKGROUND PROCESSING");

        whatsappWebhookService
            .processIncoming(payload)
            .then((result)=>{
                debugLog(`PROCESSING SUCCESS: ${JSON.stringify(result).slice(0, 200)}`, {
                  success: result?.success,
                });
            })
            .catch((error:any)=>{

                debugLog(`PROCESSING ERROR: ${error?.message || error}`, {
                  error: error?.message,
                  code: error?.code,
                  stack: error?.stack?.split("\n").slice(0, 3).join(" "),
                });

                console.error(
                    "WHATSAPP BACKGROUND PROCESSING ERROR",
                    error
                );

            });

    }
    catch(error:any){

        debugLog(`ROUTE ERROR: ${error?.message || error}`);

        console.error(
            "WHATSAPP ROUTE ERROR",
            error
        );

        if (!res.headersSent) {

            return res.status(500).json({

                success:false,

                message:error.message

            });

        }

    }


  }
);




whatsappRouter.get(
  "/conversations",
  authenticateJWT,
  WhatsAppApiController.listConversations
);

whatsappRouter.get(
  "/conversations/:phone/messages",
  authenticateJWT,
  WhatsAppApiController.getConversationMessages
);

whatsappRouter.get(
  "/activity",
  authenticateJWT,
  WhatsAppApiController.listActivity
);

whatsappRouter.post(
  "/send",
  authenticateJWT,
  WhatsAppApiController.sendMessage
);


whatsappRouter.get(
"/health",
(req,res)=>{


res.json(
whatsappWebhookService.health()
);


});



whatsappRouter.post(
  "/test",
  authenticateJWT,
  WhatsAppApiController.testMessage
);


export {
    whatsappRouter
};


export default whatsappRouter;