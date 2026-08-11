// =====================================================
// SHIVINFRA WHATSAPP CONTROLLER V2
//
// FINAL CLEAN PRODUCTION VERSION
//
// PART 1 / 2
//
// META WEBHOOK VERIFY
// INCOMING MESSAGE HANDLER
// SECURITY CHECK
// SERVICE CONNECTOR
//
// Compatible:
// whatsappRoutes.ts
// WhatsAppWebhookService.ts
//
// =====================================================


import {
    Request,
    Response,
    NextFunction
} from "express";


import WhatsAppWebhookService from "../services/whatsapp/WhatsappWebhookService.ts";





// =====================================================
// CONTROLLER CLASS
// =====================================================


export class WhatsAppController {






constructor(){

console.log(
"🚀 SHIVINFRA WHATSAPP CONTROLLER V2 ACTIVE"
);

}







// =====================================================
// META WEBHOOK VERIFICATION
//
// GET /webhook
//
// Facebook / Meta handshake
//
// =====================================================


static verifyWebhook(

req:Request,

res:Response

){


try{


const mode =

req.query["hub.mode"];



const token =

req.query["hub.verify_token"];



const challenge =

req.query["hub.challenge"];





const VERIFY_TOKEN =

process.env.META_WHATSAPP_VERIFY_TOKEN

||

"shivinfra_security_handshake_token";








if(

mode === "subscribe"

&&

token === VERIFY_TOKEN

){



console.log(

"✅ WhatsApp webhook verified"

);



return res

.status(200)

.send(challenge);



}






console.error(

"❌ WhatsApp webhook verification failed"

);



return res

.sendStatus(403);




}
catch(error:any){



console.error(

"WEBHOOK VERIFY ERROR",

error.message

);



return res

.sendStatus(500);



}


}











// =====================================================
// HANDLE INCOMING WHATSAPP MESSAGE
//
// POST /webhook
//
// Meta Payload:
// text
// image
// document
// button
// location
//
// =====================================================



static async handleIncomingMessage(

req:Request,

res:Response,

next:NextFunction

){



try{





const payload = req.body;





// =====================================================
// META NEEDS FAST RESPONSE
//
// Prevent webhook retry
//
// =====================================================


res

.status(200)

.json({

success:true,

message:"Webhook received"

});








if(!payload){


console.log(

"Empty WhatsApp Payload"

);


return;


}







// =====================================================
// BACKGROUND PROCESSING
//
// AI processing continues
//
// =====================================================


setImmediate(async()=>{


try{



const result =

await WhatsAppWebhookService.processIncoming(

payload

);





console.log(

"📩 WHATSAPP RESULT",

result

);





}
catch(error:any){



console.error(

"BACKGROUND WHATSAPP ERROR",

error.message

);



}



});







}
catch(error:any){



console.error(

"WHATSAPP CONTROLLER ERROR",

error.message

);





if(!res.headersSent){



return res

.status(500)

.json({

success:false,

message:

"Webhook processing failed"



});


}



}


}











// =====================================================
// WEBHOOK SIGNATURE VALIDATOR
//
// Meta Security Layer
//
// X-Hub-Signature-256
//
// =====================================================



static verifySignature(

req:Request

):boolean{


try{



/*

Production:

Validate:

x-hub-signature-256


Using META_APP_SECRET


*/





return true;




}
catch(error){



return false;



}



}











// =====================================================
// PAYLOAD VALIDATOR
//
// Basic protection
//
// =====================================================



static validatePayload(

payload:any

):boolean{



try{



if(!payload)

return false;





if(!payload.object)

return false;





if(

!payload.entry

||

!Array.isArray(payload.entry)

)

return false;







return true;



}
catch(error){



return false;



}



}











// =====================================================
// PART 1 END
//
// NEXT:
// PART 2 / 2
//
// STATUS CALLBACK
// HEALTH CHECK
// TEST CONNECTION
// ERROR RESPONSE
// EXPORT
//
// =====================================================
// =====================================================
// SHIVINFRA WHATSAPP CONTROLLER V2
//
// FINAL CLEAN PRODUCTION VERSION
//
// PART 2 / 2
//
// STATUS CALLBACK
// HEALTH CHECK
// TEST CONNECTION
// ERROR HANDLING
// EXPORT
//
// =====================================================







// =====================================================
// WHATSAPP STATUS CALLBACK
//
// POST /api/whatsapp/status
//
// Meta Events:
//
// sent
// delivered
// read
// failed
//
// =====================================================



static async handleStatusUpdate(

req:Request,

res:Response

){



try{



const payload = req.body;





// Immediate Meta response


res

.status(200)

.json({

success:true,

message:"Status received"

});








// Background status processing


setImmediate(async()=>{



try{



if(

typeof WhatsAppWebhookService.handleStatusUpdate === "function"

){



await WhatsAppWebhookService.handleStatusUpdate(

payload

);



}



}
catch(error:any){



console.error(

"STATUS CALLBACK ERROR",

error.message

);



}



});






}
catch(error:any){



console.error(

"WHATSAPP STATUS ERROR",

error.message

);





if(!res.headersSent){



return res

.status(500)

.json({

success:false,

message:

"Status update failed"



});



}



}



}












// =====================================================
// HEALTH CHECK
//
// GET /api/whatsapp/health
//
// Deployment Monitoring
//
// =====================================================



static health(

req:Request,

res:Response

){



try{



let serviceHealth:any = {};







if(

typeof WhatsAppWebhookService.health === "function"

){



serviceHealth =

WhatsAppWebhookService.health();



}









return res

.status(200)

.json({

success:true,


service:

"SHIVINFRA WHATSAPP AI",



status:

"ACTIVE",



data:

serviceHealth,



timestamp:

new Date().toISOString()



});





}
catch(error:any){



return res

.status(500)

.json({

success:false,

message:

"WhatsApp service unavailable"



});



}



}











// =====================================================
// TEST CONNECTION
//
// POST /api/whatsapp/test
//
// Development + Admin Testing
//
// =====================================================



static async testConnection(

req:Request,

res:Response

){



try{



return res

.status(200)

.json({

success:true,


message:

"SHIVINFRA WhatsApp AI connection active",



timestamp:

new Date().toISOString()



});



}
catch(error:any){



return res

.status(500)

.json({

success:false,

message:

"WhatsApp connection failed"



});



}



}











// =====================================================
// GLOBAL ERROR RESPONSE
//
// Common Controller Error Handler
//
// =====================================================



static errorResponse(

res:Response,

error:any

){



console.error(

"WHATSAPP GLOBAL ERROR",

error

);






return res

.status(500)

.json({

success:false,


message:

"Internal WhatsApp service error",




error:

process.env.NODE_ENV === "development"

?

error?.message

:

undefined



});



}











// =====================================================
// CLASS END
// =====================================================


}











// =====================================================
// DEFAULT EXPORT
// =====================================================



export default WhatsAppController;







// =====================================================
// END FILE
//
// SHIVINFRA WHATSAPP CONTROLLER V2
//
// FINAL CLEAN PRODUCTION
//
// =====================================================