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







app.use(

cors({

origin:"*",


methods:[

"GET",

"POST",

"PUT",

"PATCH",

"DELETE"

],



allowedHeaders:[

"Content-Type",

"Authorization"

]

})

);









// REQUEST LOGGER

app.use(

morgan(

"combined"

)

);









// BODY PARSER


app.use(

express.json({

limit:"50mb"

})

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