// ============================================
// SHIVINFRA SERVER V15
// FINAL PRODUCTION EXPRESS + VITE SERVER
//
// AI ERP READY
// WEB + WHATSAPP AI READY
// ============================================



import express from "express";

import path from "path";

import dotenv from "dotenv";

import cors from "cors";

import helmet from "helmet";

import morgan from "morgan";

import { createServer as createViteServer } from "vite";

import { startFollowUpScheduler, stopFollowUpScheduler } from "./backend/services/followUpService.ts";




dotenv.config();






async function startServer(){



const app = express();





const PORT =

Number(process.env.PORT) || 3000;









// ============================================
// SECURITY MIDDLEWARE
// ============================================



app.use(

helmet({

contentSecurityPolicy:false

})

);







const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = isProduction
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
      ];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"), false);
        },
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);









// REQUEST LOGGER

app.use(

morgan(

"combined"

)

);









// BODY PARSER


// BODY PARSER (tolerant for the Meta webhook)
//
// Meta retries on ANY non-200 response, so the WhatsApp webhook endpoint must
// ALWAYS acknowledge with 200 OK, even when the JSON body is malformed or the
// shape is unexpected. A body-parse failure is logged separately but never
// allowed to propagate to the HTTP response. Other routes keep default 500
// behavior on bad JSON.
app.use(
    (req: any, res: any, next: any) => {

        const isWebhook =
            req.path === "/api/v1/whatsapp/webhook" ||
            String(req.originalUrl || "").includes("/whatsapp/webhook");

        const parser = express.json({
            limit: "50mb",
            verify: (request: any, _res: any, buf: Buffer) => {
                // Preserve raw body for Meta webhook signature verification
                if (buf && buf.length) {
                    request.rawBody = buf;
                }
            }
        });

        parser(req, res, (err: any) => {

            if (err) {

                if (isWebhook) {

                    console.error(
                        "[WEBHOOK BODY PARSE ERROR]",
                        req.originalUrl,
                        err?.message || err
                    );

                    req.body = {};
                    req.bodyParseError = err?.message || "invalid json";

                    return next();

                }

                return next(err);

            }

            next();

        });

    }
);



app.use(

express.urlencoded({

extended:true,

limit:"50mb"

})

);









// ============================================
// SERVER HEALTH
// ============================================



app.get(

"/health",

(req,res)=>{


res.json({

success:true,


service:

"SHIVINFRA SERVER",



version:

"V15",



status:

"RUNNING",



timestamp:

new Date()


});


}

);











// ============================================
// BACKEND API ROUTES
// ============================================



try{



const {

backendRouter

}

=

await import(

"./backend/app.ts"

);







app.use(

"/api",

backendRouter

);







console.log(

    "✅ SHIVINFRA API ROUTES LOADED"

);


startFollowUpScheduler();





}

catch(error:any){



console.error(

"❌ ROUTE LOAD ERROR",

error.message

);



throw error;



}









// ============================================
// STATIC UPLOADS
// ============================================



app.use(

"/uploads",

express.static(

path.join(

process.cwd(),

"uploads"

)

)

);









// ============================================
// FRONTEND VITE
// ============================================



if(

process.env.NODE_ENV !== "production"

){



console.log(

"⚡ VITE DEVELOPMENT MODE"

);





const vite =

await createViteServer({

server:{


middlewareMode:true

},



appType:"spa"



});






app.use(

vite.middlewares

);



}

else{



const distPath =

path.join(

process.cwd(),

"dist"

);






app.use(

express.static(

distPath

)

);







app.get(

"*",

(req,res)=>{


res.sendFile(

path.join(

distPath,

"index.html"

)

);



}

);



}









// ============================================
// 404 HANDLER
// ============================================



app.use(

(req,res)=>{


res.status(404)

.json({

success:false,


code:

"NOT_FOUND",


message:

"API route not found"


});


}

);









// ============================================
// GLOBAL ERROR HANDLER
// ============================================



app.use(

(

err:any,

req:express.Request,

res:express.Response,

next:express.NextFunction

)=>{



console.error(

"🔥 SERVER ERROR",

err

);





res.status(500)

.json({


success:false,


code:

"SERVER_ERROR",


message:

err.message ||

"Internal server error"



});



}

);











// ============================================
// START SERVER
// ============================================



const server =

app.listen(

PORT,

"0.0.0.0",

()=>{


console.log(`


====================================

🚀 SHIVINFRA SERVER V15 STARTED


PORT:

${PORT}



API:

http://localhost:${PORT}/api



AI:

http://localhost:${PORT}/api/v1/ai



HEALTH:

http://localhost:${PORT}/health



====================================


`);



}

);









// ============================================
// GRACEFUL SHUTDOWN
// ============================================



process.on(

"SIGTERM",

()=>{


console.log(

"SIGTERM RECEIVED"

);



server.close(()=>{


    stopFollowUpScheduler();


    console.log(

        "SERVER CLOSED"

    );


    process.exit(0);


});


}

);





}





startServer()

.catch(

error=>{


console.error(

"FATAL SERVER ERROR",

error

);



process.exit(1);



}

);