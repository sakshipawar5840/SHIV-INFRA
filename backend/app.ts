// ============================================
// SHIVINFRA BACKEND APP V16
// FINAL PRODUCTION API ROUTER
//
// AI ERP + CRM PLATFORM
// WEB + WHATSAPP AI AGENT READY
// ============================================


import {
    Router,
    Request,
    Response
} from "express";


import cors from "cors";

import helmet from "helmet";

import compression from "compression";

import morgan from "morgan";

import rateLimit from "express-rate-limit";




// ============================================
// ROUTES
// ============================================


import authRouter from "./routes/authRoutes.ts";


import {
    projectRouter
}
from "./routes/projectRoutes.ts";


import {
    customerRouter
}
from "./routes/customerRoutes.ts";


import {
    leadRouter
}
from "./routes/leadRoutes.ts";


import {
    billRouter
}
from "./routes/billRoutes.ts";


import {
    expenseRouter
}
from "./routes/expenseRoutes.ts";


import {
    siteVisitRouter
}
from "./routes/siteVisitRoutes.ts";


import {
    reportRouter
}
from "./routes/reportRoutes.ts";


import {
    subscriptionRouter
}
from "./routes/subscriptionRoutes.ts";


import {
    whatsappRouter
}
from "./routes/whatsappRoutes.ts";


import aiRouter
from "./routes/aiRoutes.ts";


import {
    notificationRouter
}
from "./routes/notificationRoutes.ts";


import {
    inventoryRouter
}
from "./routes/inventoryRoutes.ts";


import {
    vendorRouter
}
from "./routes/vendorRoutes.ts";


import {
    taskRouter
}
from "./routes/taskRoutes.ts";


import {
    documentRouter
}
from "./routes/documentRoutes.ts";


import {
    userRouter
}
from "./routes/userRoutes.ts";


import {
    settingRouter
}
from "./routes/settingRoutes.ts";


import {
    activityLogRouter
}
from "./routes/activityLogRoutes.ts";


import {
    inquiryRouter
}
from "./routes/inquiryRoutes.ts";


import {
    dashboardRouter
}
from "./routes/dashboardRoutes.ts";


import googleOAuthRouter
from "./routes/googleOAuthRoutes.ts";

import broadcastRouter
from "./routes/broadcastRoutes.ts";

import channelRouter
from "./routes/channelRoutes.ts";


import {
    errorHandler
}
from "./middleware/errorHandler.ts";





// ============================================
// MAIN BACKEND ROUTER
// ============================================


export const backendRouter = Router();






// ============================================
// SECURITY MIDDLEWARE
// ============================================
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = isProduction
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
      ];

backendRouter.use(
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





backendRouter.use(

helmet({

    contentSecurityPolicy:false,

    crossOriginResourcePolicy:false

})

);





backendRouter.use(

compression()

);





backendRouter.use(

morgan("combined")

);







// ============================================
// RATE LIMIT
// ============================================



const apiLimiter = rateLimit({

    windowMs:

    15 * 60 * 1000,


    max:

    500,


    message:{

        success:false,

        message:

        "Too many requests. Please try again later."

    },


    standardHeaders:true,

    legacyHeaders:false

});




backendRouter.use(

apiLimiter

);









// ============================================
// HEALTH CHECK
// ============================================


backendRouter.get(

"/health",

(
req:Request,
res:Response
)=>{


return res.json({

    success:true,


    service:

    "SHIVINFRA AI ERP BACKEND",


    version:

    "V16",


    environment:

    process.env.NODE_ENV || "development",


    status:

    "RUNNING",



    modules:[


        "AUTH",

        "PROJECT ERP",

        "CUSTOMER CRM",

        "LEAD MANAGEMENT",

        "EXPENSE ENGINE",

        "BILL OCR",

        "REPORT ENGINE",

        "WHATSAPP AI",

        "AI AGENT"

    ],



    timestamp:

    new Date()

});


}

);









// ============================================
// API VERSION 1
// /api/v1
// ============================================


const v1 = Router();








// ============================================
// AUTH
// ============================================


v1.use(

"/auth",

authRouter

);







// ============================================
// PROJECT MANAGEMENT
// ============================================


v1.use(

"/projects",

projectRouter

);







// ============================================
// CUSTOMER CRM
// ============================================


v1.use(

"/customers",

customerRouter

);







// ============================================
// LEADS
// ============================================


v1.use(

"/leads",

leadRouter

);







// ============================================
// BILL + OCR
// ============================================


v1.use(

"/bills",

billRouter

);







// ============================================
// EXPENSE MANAGEMENT
// ============================================


v1.use(

"/expenses",

expenseRouter

);







// ============================================
// AI AGENT CORE
//
// POST /api/v1/ai/chat
//
// ============================================


v1.use(

"/ai",

aiRouter

);







// ============================================
// DASHBOARD
// ============================================


v1.use(

"/dashboard",

dashboardRouter

);







// ============================================
// WHATSAPP AI ENGINE
// ============================================


v1.use(

"/whatsapp",

whatsappRouter

);







// ============================================
// BROADCAST MESSAGING
// ============================================


v1.use(
    "/broadcasts",
    broadcastRouter
);

// ============================================
// MESSAGING CHANNELS (WhatsApp / Facebook / IG / SMS)
// ============================================

v1.use(
    "/channels",
    channelRouter
);


// ============================================
// REPORT ENGINE
// ============================================


v1.use(

"/reports",

reportRouter

);







// ============================================
// SUBSCRIPTION SYSTEM
// ============================================


v1.use(

"/subscriptions",

subscriptionRouter

);







// ============================================
// NOTIFICATIONS
// ============================================


v1.use(

"/notifications",

notificationRouter

);







// ============================================
// SITE VISITS
// ============================================


v1.use(

"/site-visits",

siteVisitRouter

);










// ============================================
// INVENTORY
// ============================================


v1.use(

"/inventory",

inventoryRouter

);


// ============================================
// VENDORS
// ============================================


v1.use(

"/vendors",

vendorRouter

);


// ============================================
// TASKS
// ============================================


v1.use(

"/tasks",

taskRouter

);


// ============================================
// DOCUMENTS
// ============================================


v1.use(

"/documents",

documentRouter

);


// ============================================
// USERS
// ============================================


v1.use(

"/users",

userRouter

);


// ============================================
// SETTINGS
// ============================================


v1.use(

"/settings",

settingRouter

);


// ============================================
// ACTIVITY LOGS
// ============================================


v1.use(

"/activity-logs",

activityLogRouter

);


// ============================================
// INQUIRIES
// ============================================


v1.use(

"/inquiries",

inquiryRouter

);


// ============================================
// GOOGLE OAUTH
// ============================================


v1.use(

"/google/oauth",

googleOAuthRouter

);




// ============================================
// REGISTER V1
//
// /api/v1/*
//
// ============================================


backendRouter.use(

"/v1",

v1

);









// ============================================
// API NOT FOUND
// ============================================


backendRouter.use(

(
req:Request,
res:Response
)=>{


return res.status(404)

.json({

    success:false,


    code:

    "API_NOT_FOUND",


    message:

    "Requested API endpoint does not exist"


});


}

);









// ============================================
// GLOBAL ERROR HANDLER
// ============================================


backendRouter.use(

errorHandler

);
