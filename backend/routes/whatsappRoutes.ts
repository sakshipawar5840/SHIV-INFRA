import { Router } from "express";

import whatsappWebhookService from "../services/whatsapp/WhatsappWebhookService.ts";


const whatsappRouter = Router();



// ============================================
// WEBHOOK VERIFY
// ============================================

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





// ============================================
// RECEIVE MESSAGE
// ============================================


whatsappRouter.post(
"/webhook",
async(req,res)=>{


try{


const result =
await whatsappWebhookService.processIncoming(
req.body
);



return res.status(200).json(result);



}
catch(error:any){


console.error(
"WHATSAPP ROUTE ERROR",
error
);


return res.status(500).json({

success:false,

message:error.message

});


}


});





// ============================================
// HEALTH
// ============================================


whatsappRouter.get(
"/health",
(req,res)=>{


res.json(
whatsappWebhookService.health()
);


});





export {
    whatsappRouter
};


export default whatsappRouter;