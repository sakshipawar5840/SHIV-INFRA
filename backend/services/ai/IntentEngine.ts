// ============================================================
// SHIVINFRA AI SERVICE V31
// PART 2 / 8
//
// INTENT ENGINE
//
// Features:
//
// ✅ Smart Rule Router
// ✅ Marathi + English
// ✅ Gemini Fallback
// ✅ CRUD Intent Detection
// ✅ Construction ERP Commands
//
// ============================================================


import { GoogleGenAI } from "@google/genai";

// import {
//     AIIntentResult,
//     AIUserContext
// } from "./types.ts";

type AIIntentResult = any;
type AIUserContext = any;




// ============================================================
// CONFIG
// ============================================================


const MODEL_NAME =
String(
    process.env.GEMINI_MODEL ||
    "gemini-flash-latest"
).trim();



const GEMINI_API_KEY =
process.env.GEMINI_API_KEY;



const aiClient =

GEMINI_API_KEY

?

new GoogleGenAI({

apiKey:GEMINI_API_KEY

})

:

null;





// ============================================================
// INTENT ENGINE CLASS
// ============================================================


class IntentEngine {





// ============================================================
// MAIN DETECTOR
// ============================================================


async detect(

message:string,

entities:any,

user:AIUserContext,

memory?:any

):Promise<AIIntentResult>{



try{



// 1) SMART ROUTER

const direct =

this.smartRouter(

message,

entities

);



if(direct){


return direct;


}






// 2) GEMINI FALLBACK


if(aiClient){



const gemini =

await this.geminiDetect(

message,

entities,

memory

);



if(gemini){


return gemini;


}



}






// 3) FINAL FALLBACK


return {


intent:

"GENERAL_CHAT",


confidence:

0.50,


parameters:{


message


}



};



}

catch(error){



console.error(

"Intent Engine Error",

error

);



return {


intent:

"GENERAL_CHAT",


confidence:

0.40,


parameters:{


message


}



};



}



}









// ============================================================
// SMART ROUTER
// ============================================================


private smartRouter(

message:string,

entities:any

):AIIntentResult|null{



const text =

message.toLowerCase();





// ========================================================
// PROJECT
// ========================================================


if(

entities.entity === "PROJECT"

){



if(

this.hasAny(

text,

[

"delete",

"remove",

"delete project"

]

)

){



return this.result(

"DELETE_PROJECT",

entities

);


}




if(

this.hasAny(

text,

[

"update",

"edit",

"change",

"modify"

]

)

){



return this.result(

"UPDATE_PROJECT",

entities

);



}





if(

this.hasAny(

text,

[

"add",

"create",

"new",

"save",

"make"

]

)

){



return this.result(

"ADD_PROJECT",

entities

);



}





if(

this.hasAny(

text,

[

"show",

"find",

"search",

"list",

"available",

"display"

]

)

){



return this.result(

"SEARCH_PROJECTS",

entities

);



}



}









// ========================================================
// CUSTOMER
// ========================================================


if(

entities.entity === "CUSTOMER"

){



if(

this.hasAny(

text,

[

"delete",

"remove"

]

)

){



return this.result(

"DELETE_CUSTOMER",

entities

);



}




if(

this.hasAny(

text,

[

"update",

"edit",

"change"

]

)

){



return this.result(

"UPDATE_CUSTOMER",

entities

);



}




if(

this.hasAny(

text,

[

"add",

"create",

"new",

"save"

]

)

){



return this.result(

"ADD_CUSTOMER",

entities

);



}




if(

this.hasAny(

text,

[

"show",

"search",

"find",

"list"

]

)

){



return this.result(

"SEARCH_CUSTOMERS",

entities

);



}



}









// ========================================================
// LEAD
// ========================================================


if(

entities.entity === "LEAD"

){



if(

this.hasAny(

text,

[

"search",

"show",

"find"

]

)

){



return this.result(

"SEARCH_LEADS",

entities

);



}





return this.result(

"ADD_LEAD",

entities

);



}









// ========================================================
// EXPENSE
// ========================================================


if(

entities.entity === "EXPENSE"

){



if(

this.hasAny(

text,

[

"show",

"search",

"list"

]

)

){



return this.result(

"SEARCH_EXPENSES",

entities

);



}




return this.result(

"ADD_EXPENSE",

entities

);



}









// ========================================================
// BILL
// ========================================================


if(

entities.entity === "BILL"

){



return {


intent:

"UPLOAD_BILL",


confidence:

0.98,


parameters:

entities



};



}









// ========================================================
// REPORT
// ========================================================


if(

entities.entity === "REPORT"

){



return {


intent:

"GENERATE_REPORT",


confidence:

0.97,


parameters:

entities



};



}







return null;



}









// ============================================================
// RESULT BUILDER
// ============================================================


private result(

intent:string,

entities:any

):AIIntentResult{



return {


intent,


confidence:

0.98,


parameters:

entities



};



}









// ============================================================
// GEMINI INTENT DETECTOR
// ============================================================


private async geminiDetect(

message:string,

entities:any,

memory:any

):Promise<AIIntentResult|null>{



try{



const prompt = `


You are SHIVINFRA AI ERP Agent.


Understand construction ERP commands.


Return ONLY JSON.



User:

${message}



Entity:

${JSON.stringify(entities)}



Memory:

${JSON.stringify(memory || {})}



Available intents:


ADD_PROJECT

SEARCH_PROJECTS

UPDATE_PROJECT

DELETE_PROJECT


ADD_CUSTOMER

SEARCH_CUSTOMERS

UPDATE_CUSTOMER

DELETE_CUSTOMER


ADD_LEAD

SEARCH_LEADS


ADD_EXPENSE

SEARCH_EXPENSES


UPLOAD_BILL


GENERATE_REPORT


GENERAL_CHAT




Rules:


- Marathi and English both allowed.
- Phone number is not amount.
- lakh = 100000.
- crore = 10000000.
- Return only JSON.



`;




const response:any =

await aiClient!.models.generateContent({


model:

MODEL_NAME,


contents:

prompt,


config:{


temperature:0.1


}


});






let output =

response.text;




if(typeof output==="function"){

output = output();

}





output = output

.replace(/```json/g,"")

.replace(/```/g,"")

.trim();





const json =

JSON.parse(output);






if(!json.intent)

return null;





return {


intent:

json.intent,


confidence:

Number(json.confidence)||0.90,


parameters:

json.parameters || {}



};



}

catch(error){



console.error(

"Gemini Intent Failed",

error

);



return null;



}



}









// ============================================================
// HELPERS
// ============================================================


private hasAny(

text:string,

words:string[]

){



return words.some(

word =>

text.includes(word)

);



}



}




export default IntentEngine;