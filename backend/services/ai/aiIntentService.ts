// ============================================
// SHIVINFRA AI INTENT SERVICE
// PRODUCTION VERSION
//
// JOB:
// User Message
//        ↓
// Detect Intent
//        ↓
// Return ERP Command
// ============================================


import {
    askGemini,
    isAIAvailable
}
from "./geminiClient.ts";





// ============================================
// INTENT LIST
// ============================================


export type AIIntentName =


"ADD_PROJECT" |
"SEARCH_PROJECTS" |
"UPDATE_PROJECT" |
"DELETE_PROJECT" |


"ADD_CUSTOMER" |
"SEARCH_CUSTOMERS" |
"UPDATE_CUSTOMER" |
"DELETE_CUSTOMER" |


"ADD_LEAD" |
"SEARCH_LEADS" |
"UPDATE_LEAD" |
"DELETE_LEAD" |


"ADD_EXPENSE" |
"SEARCH_EXPENSES" |
"UPDATE_EXPENSE" |
"DELETE_EXPENSE" |


"UPLOAD_BILL" |
"SEARCH_BILLS" |


"GENERATE_REPORT" |


"GENERAL_CHAT";








// ============================================
// RESPONSE TYPE
// ============================================


export interface AIIntent {


    intent:AIIntentName;


    confidence:number;


    parameters:any;


}







class AIIntentService {






// ============================================
// MAIN FUNCTION
// ============================================


static async detectIntent(


message:string,


role:string="admin"


):Promise<AIIntent>{





if(
!message ||
message.trim()===""
){


return {


intent:"GENERAL_CHAT",

confidence:0,

parameters:{}


};


}








// ============================================
// GEMINI MODE
// ============================================


if(
isAIAvailable()
){



try{



const prompt = `


You are SHIVINFRA AI ERP Assistant.



You control Construction ERP System.



Understand:

English

Marathi

Hinglish




User Role:

${role}




User Message:

${message}






Convert message into JSON.



Available commands:



PROJECT

ADD_PROJECT

SEARCH_PROJECTS

UPDATE_PROJECT

DELETE_PROJECT



CUSTOMER

ADD_CUSTOMER

SEARCH_CUSTOMERS

UPDATE_CUSTOMER

DELETE_CUSTOMER



LEAD

ADD_LEAD

SEARCH_LEADS

UPDATE_LEAD

DELETE_LEAD



EXPENSE

ADD_EXPENSE

SEARCH_EXPENSES

UPDATE_EXPENSE

DELETE_EXPENSE



BILL

UPLOAD_BILL

SEARCH_BILLS



REPORT

GENERATE_REPORT



GENERAL

GENERAL_CHAT






Rules:

- Never create fake id

- Keep missing value empty

- Convert lakh/crore into numbers

- Return only JSON




Format:


{
"intent":"ADD_PROJECT",
"confidence":0.95,
"parameters":{
}
}


`;





const result =

await askGemini(

prompt

);






return this.cleanJSON(

result

);



}
catch(error:any){


console.log(

"AI FAILED USING FALLBACK"

);


return this.fallback(

message

);



}


}








// ============================================
// FALLBACK MODE
// ============================================


return this.fallback(

message

);



}









// ============================================
// JSON CLEANER
// ============================================


private static cleanJSON(

text:string

):AIIntent{


try{


const clean =

text

.replace(
/```json/g,
""
)

.replace(
/```/g,
""
)

.trim();





return JSON.parse(

clean

);



}
catch(error){



return {


intent:"GENERAL_CHAT",

confidence:0.2,

parameters:{}


};


}



}









// ============================================
// OFFLINE FALLBACK
// ============================================


private static fallback(

message:string

):AIIntent{


const msg =

message.toLowerCase();






// PROJECT


if(

msg.includes("project") ||

msg.includes("site") ||

msg.includes("property")

){



if(

msg.includes("add") ||

msg.includes("create") ||

msg.includes("new")

){



return {


intent:"ADD_PROJECT",

confidence:0.90,


parameters:{


project_name:message


}


};


}





if(

msg.includes("show") ||

msg.includes("search") ||

msg.includes("find")

){



return {


intent:"SEARCH_PROJECTS",

confidence:0.90,


parameters:{


query:message


}


};


}



}







// CUSTOMER


if(

msg.includes("customer") ||

msg.includes("client") ||

msg.includes("grahak")

){



if(

msg.includes("add") ||

msg.includes("new")

){



return {


intent:"ADD_CUSTOMER",

confidence:0.90,


parameters:{


name:message


}


};


}





if(

msg.includes("show") ||

msg.includes("search")

){



return {


intent:"SEARCH_CUSTOMERS",

confidence:0.90,


parameters:{


query:message


}


};



}



}








// LEAD


if(

msg.includes("lead") ||

msg.includes("enquiry")

){



return {


intent:"ADD_LEAD",

confidence:0.85,


parameters:{


requirement:message,


status:"New"


}


};


}







// EXPENSE


if(

msg.includes("expense") ||

msg.includes("kharcha") ||

msg.includes("खर्च")

){



return {


intent:"ADD_EXPENSE",

confidence:0.85,


parameters:{


expense_title:message,


amount:0


}


};


}








return {


intent:"GENERAL_CHAT",

confidence:0.5,


parameters:{}


};



}





}





export default AIIntentService;