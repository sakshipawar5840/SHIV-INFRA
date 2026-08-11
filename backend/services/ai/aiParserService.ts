// ============================================
// SHIVINFRA AI PARSER SERVICE V8
// PRODUCTION INTENT PARSER ENGINE
//
// PART 1 / 4
//
// GEMINI ENGINE
// TYPES
// CORE PARSER
// CUSTOMER FIX ENGINE
// ============================================


import { GoogleGenAI } from "@google/genai";




// ============================================
// TYPES
// ============================================


export interface AIIntentResult {


    intent:string;


    confidence:number;


    parameters:any;


}






// ============================================
// CLASS
// ============================================


class AIParserService {



private ai:any;


private model:string =
String(process.env.GEMINI_MODEL || "gemini-flash-latest").trim();





constructor(){



const key =
process.env.GEMINI_API_KEY;




if(key){


this.ai =
new GoogleGenAI({

apiKey:key

});



console.log(
"🤖 SHIVINFRA AI PARSER V8 GEMINI READY"
);



}
else{


console.log(
"⚠ GEMINI KEY NOT FOUND FALLBACK MODE"
);


}



}









// ============================================
// MAIN PARSER
// ============================================


async parseMessage(

message:string

):Promise<AIIntentResult>{



try{



if(!message || !message.trim()){


return {


intent:"GENERAL_CHAT",


confidence:0.5,


parameters:{}


};


}






// CUSTOMER FIRST DETECTION


const customerIntent =
this.customerParser(message);



if(customerIntent){


return customerIntent;


}







// PROJECT PRICE UPDATE PRIORITY


const lower =
message.toLowerCase();





if(


(
lower.includes("update")
||
lower.includes("change")
||
lower.includes("edit")
)

&&

(
lower.includes("price")
||
lower.includes("rate")
||
lower.includes("cost")
)


){



return {


intent:"UPDATE_PROJECT",


confidence:0.98,


parameters:{



project_name:
this.extractProjectName(message),



price:
this.extractAmount(message)



}


};



}








// GEMINI


if(this.ai){



const result =
await this.geminiParse(message);



if(result){


return result;


}


}







return this.fallbackParser(message);



}
catch(error:any){



console.log(

"AI PARSER ERROR:",

error.message

);



return this.fallbackParser(message);



}




}









// ============================================
// CUSTOMER PARSER
//
// ADD CUSTOMER
// UPDATE CUSTOMER
// DELETE CUSTOMER
//
// FIX:
// "customer Rahul Patil phone"
// ============================================


private customerParser(

message:string

):AIIntentResult|null{



const text =
message.toLowerCase();





const isCustomer =

text.includes("customer")
||
text.includes("client")
||
text.includes("add customer")
||
text.includes("create customer");






if(!isCustomer){


return null;


}







if(

text.includes("add")
||
text.includes("create")
||
text.includes("new")

){



return {


intent:"ADD_CUSTOMER",


confidence:0.97,


parameters:{


name:
this.extractCustomerName(message),



phone:
this.extractPhone(message),



city:
this.extractCity(message),



budget:
this.extractAmount(message),



source:"AI"



}



};



}








if(

text.includes("update")
||
text.includes("edit")
||
text.includes("change")

){



return {


intent:"UPDATE_CUSTOMER",


confidence:0.96,


parameters:{



name:
this.extractCustomerName(message),



phone:
this.extractPhone(message),



city:
this.extractCity(message),



budget:
this.extractAmount(message)



}


};



}








if(

text.includes("delete")
||
text.includes("remove")

){



return {


intent:"DELETE_CUSTOMER",


confidence:0.96,


parameters:{


name:
this.extractCustomerName(message),


phone:
this.extractPhone(message)



}



};



}








return null;



}









// ============================================
// GEMINI PARSER
// ============================================


private async geminiParse(

message:string

):Promise<AIIntentResult|null>{



try{


const prompt = `


You are SHIVINFRA AI ERP Agent.


Return ONLY JSON.


Supported intents:


ADD_PROJECT
UPDATE_PROJECT
DELETE_PROJECT
SEARCH_PROJECTS


ADD_CUSTOMER
UPDATE_CUSTOMER
DELETE_CUSTOMER
SEARCH_CUSTOMERS


ADD_LEAD
UPDATE_LEAD
DELETE_LEAD
SEARCH_LEADS


ADD_EXPENSE
UPLOAD_BILL
GENERATE_REPORT


GENERAL_CHAT



Rules:


Phone number is never budget.


Money:

1 lakh = 100000

1 crore = 10000000



USER:

${message}



`;





const response =

await this.ai.models.generateContent({


model:this.model,


contents:prompt


});





const json =
this.extractJSON(

response.text || ""

);





if(!json)

return null;






return {


intent:
json.intent || "GENERAL_CHAT",



confidence:
Number(json.confidence || 0.8),



parameters:
json.parameters || {}



};



}
catch(error:any){


console.log(

"GEMINI ERROR",

error.message

);



return null;


}



}
// ============================================
// SHIVINFRA AI PARSER SERVICE V8
// PART 2 / 4
//
// JSON EXTRACTOR
// FALLBACK ENGINE
// PHONE ENGINE
// AMOUNT ENGINE
// CUSTOMER NAME ENGINE
// ============================================






// ============================================
// JSON EXTRACTOR
// ============================================


private extractJSON(

text:string

){



try{


return JSON.parse(text);



}
catch{



const match =

text.match(

/\{[\s\S]*\}/

);





if(match){



try{


return JSON.parse(

match[0]

);



}
catch{


return null;


}



}





return null;



}



}











// ============================================
// FALLBACK ENGINE
// ============================================


private fallbackParser(

message:string

):AIIntentResult{



const text =

message.toLowerCase();








// ============================================
// PROJECT CREATE
// ============================================


if(


text.includes("project")

&&

(

text.includes("add")

||

text.includes("create")

||

text.includes("new")

)


){



return {


intent:"ADD_PROJECT",


confidence:0.95,


parameters:{



project_name:

this.extractProjectName(message),



city:

this.extractCity(message),



price:

this.extractAmount(message)



}



};



}











// ============================================
// PROJECT UPDATE
// ============================================


if(


text.includes("project")

&&

(

text.includes("update")

||

text.includes("edit")

||

text.includes("change")

)


){



return {


intent:"UPDATE_PROJECT",


confidence:0.95,


parameters:{



project_name:

this.extractProjectName(message),



price:

this.extractAmount(message)



}



};



}











// ============================================
// SEARCH CUSTOMER
// ============================================


if(


(

text.includes("customer")

||

text.includes("client")

)

&&

(

text.includes("show")

||

text.includes("find")

||

text.includes("search")

||

text.includes("list")

)


){



return {


intent:"SEARCH_CUSTOMERS",


confidence:0.95,


parameters:{



query:

this.extractCustomerName(message),



phone:

this.extractPhone(message)



}



};



}











// ============================================
// LEAD CREATE
// ============================================


if(


text.includes("lead")

||

text.includes("interested")

||

text.includes("enquiry")



){



return {


intent:"ADD_LEAD",


confidence:0.90,


parameters:{



customer_name:

this.extractCustomerName(message),



phone:

this.extractPhone(message),



preferred_location:

this.extractCity(message),



budget:

this.extractAmount(message),



requirement:

message,



status:"New"



}



};



}











// ============================================
// EXPENSE
// ============================================


if(


text.includes("expense")

||

text.includes("spent")

||

text.includes("paid")



){



return {


intent:"ADD_EXPENSE",


confidence:0.90,


parameters:{



expense_title:

this.extractExpenseTitle(message),



amount:

this.extractAmount(message),



category:

this.extractExpenseCategory(message)



}



};



}









return {


intent:"GENERAL_CHAT",


confidence:0.60,


parameters:{


message


}



};



}









// ============================================
// REMOVE PHONE NUMBER
//
// IMPORTANT:
// 9876543210 should never become budget
// ============================================


private removePhone(

text:string

):string{



return text.replace(


/\b[6-9]\d{9}\b/g,


""



);



}









// ============================================
// PHONE EXTRACTOR
// ============================================


private extractPhone(

text:string

):string{



const result =


text.match(


/\b[6-9]\d{9}\b/


);





return result

?

result[0]

:

"";



}











// ============================================
// AMOUNT EXTRACTOR
//
// FIX:
// Phone ignore
//
// Example:
// Rahul phone 9876543210 budget 50 lakh
//
// Output:
// 5000000
// ============================================


private extractAmount(

text:string

):number{



const cleanText =


this.removePhone(text);





const matches =


[

...

cleanText.matchAll(


/(\d+(?:\.\d+)?)\s*(crore|cr|lakh|lac|lakhs|thousand|k)?/gi


)

];






let amount = 0;







for(const match of matches){



let value =

Number(match[1]);





const unit =

match[2]

?

match[2].toLowerCase()

:

"";






if(


unit==="crore"

||

unit==="cr"

){



value *= 10000000;


}



else if(


unit==="lakh"

||

unit==="lac"

||

unit==="lakhs"

){



value *= 100000;


}



else if(


unit==="thousand"

||

unit==="k"

){



value *= 1000;


}







if(value > amount

&&

value < 100000000

){



amount=value;



}



}







return amount;



}











// ============================================
// CUSTOMER NAME EXTRACTOR
//
// BEFORE:
//
// "customer Rahul Patil phone"
//
// Output:
// Rahul
//
// AFTER:
//
// Rahul Patil
// ============================================


private extractCustomerName(

text:string

):string{



let words =

text.split(/\s+/);







const ignore = [



"add",

"create",

"new",

"customer",

"client",

"phone",

"mobile",

"number",

"city",

"pune",

"mumbai",

"nashik",

"budget",

"lakh",

"lac",

"crore",

"rs",

"rupees",

"with",

"from"



];








const names:string[]=[];








for(const word of words){



const clean =


word.replace(

/[^a-zA-Z]/g,

""

);







if(


clean.length > 2

&&

!

ignore.includes(

clean.toLowerCase()

)

&&

!

/^\d+$/.test(clean)

){



names.push(clean);



}



}







return names

.map((n)=>

n.charAt(0).toUpperCase()

+

n.slice(1)

)

.join(" ")

.trim();



}

// ============================================
// SHIVINFRA AI PARSER SERVICE V8
// PART 3 / 4
//
// PROJECT ENGINE
// CITY ENGINE
// LEAD ENGINE
// EXPENSE ENGINE
// TEXT CLEANERS
// ============================================







// ============================================
// PROJECT NAME EXTRACTOR
//
// Examples:
//
// Add project Shiv Heights Pune
//
// Output:
// Shiv Heights
// ============================================


private extractProjectName(

text:string

):string{



let clean = text;





clean = clean.replace(

/add|create|new|update|change|edit|delete|remove|project|price|rate|cost|rs|₹|lakh|lac|lakhs|crore|cr|\d+/gi,

""

);





clean = clean.replace(

/\b(the|is|of|for|at|in|with)\b/gi,

""

);





return clean

.replace(/\s+/g," ")

.trim()

||

"Unknown Project";



}












// ============================================
// CITY EXTRACTOR
// ============================================


private extractCity(

text:string

):string{



const cities = [



"Pune",

"Mumbai",

"Nashik",

"Wakad",

"Hinjewadi",

"Baner",

"Kharadi",

"Thane",

"Nagpur",

"Kolhapur",

"Satara",

"Solapur",

"PCMC"



];







for(const city of cities){



if(

text

.toLowerCase()

.includes(

city.toLowerCase()

)

){



return city;



}



}





return "";



}












// ============================================
// LEAD NAME EXTRACTOR
//
// Lead message:
// Interested Rahul Patil Pune 50 lakh
// ============================================


private extractLeadName(

text:string

):string{



let words =

text.split(/\s+/);







const ignore=[



"lead",

"interested",

"customer",

"client",

"flat",

"plot",

"bhk",

"budget",

"pune",

"mumbai",

"nashik",

"phone",

"mobile",

"number",

"lakh",

"crore",

"new",

"add"



];







const result:string[]=[];







for(const word of words){



const clean =

word.replace(

/[^a-zA-Z]/g,

""

);







if(

clean.length>2

&&

!

ignore.includes(

clean.toLowerCase()

)

&&

!

/^\d+$/.test(clean)

){



result.push(clean);



}



}







return result

.map(

name =>

name.charAt(0).toUpperCase()

+

name.slice(1)

)

.join(" ")

.trim();



}












// ============================================
// EXPENSE TITLE EXTRACTOR
// ============================================


private extractExpenseTitle(

text:string

):string{



const items=[



"cement",

"sand",

"steel",

"material",

"labour",

"labor",

"transport",

"machine",

"electric",

"purchase",

"equipment"



];






for(const item of items){



if(

text

.toLowerCase()

.includes(item)

){



return item;



}



}







return "General Expense";



}












// ============================================
// EXPENSE CATEGORY
// ============================================


private extractExpenseCategory(

text:string

):string{



const value =

text.toLowerCase();







if(

value.includes("cement")

||

value.includes("steel")

||

value.includes("sand")

||

value.includes("material")

){



return "Material";



}







if(

value.includes("labour")

||

value.includes("labor")

){



return "Labour";



}







if(

value.includes("transport")

){



return "Transport";



}







return "General";



}












// ============================================
// GENERAL TEXT CLEAN
// ============================================


private cleanText(

text:string=""

):string{



return String(text)

.toLowerCase()

.replace(

/[^a-z0-9\s]/gi,

""

)

.replace(

/\s+/g,

" "

)

.trim();



}












// ============================================
// CURRENCY NORMALIZER
//
// Used for AI responses
// ============================================


private normalizeMoney(

amount:number

){



if(!amount)

return "₹0";





if(amount >= 10000000){



return (

amount / 10000000

)

.toFixed(2)

+

" Cr";



}





if(amount >= 100000){



return (

amount / 100000

)

.toFixed(2)

+

" Lakh";



}






return (

amount

.toLocaleString("en-IN")

);



}












// ============================================
// PARAMETER CLEANER
//
// Before DB insert
//
// Removes undefined/null
// ============================================


private cleanParameters(

params:any

){



const result:any={};






for(

const key in params

){



if(

params[key] !== undefined

&&

params[key] !== null

&&

params[key] !== ""

){



result[key]=params[key];



}



}







return result;



}












// ============================================
// PARSER HEALTH
// ============================================


health(){



return {



service:

"SHIVINFRA AI PARSER SERVICE",



version:

"V8",



status:

"RUNNING",



engine:

this.ai

?

"GEMINI"

:

"FALLBACK"



};



}
// ============================================
// SHIVINFRA AI PARSER SERVICE V8
// PART 4 / 4
//
// FINAL VALIDATION ENGINE
// INTENT SAFETY
// CONFIDENCE FILTER
// PRODUCTION GUARD
// EXPORT
// ============================================







// ============================================
// INTENT VALIDATOR
//
// Prevent wrong AI actions
// ============================================


private validateIntent(

result:AIIntentResult

):AIIntentResult{



const allowed=[



"ADD_PROJECT",

"UPDATE_PROJECT",

"DELETE_PROJECT",

"SEARCH_PROJECTS",



"ADD_CUSTOMER",

"UPDATE_CUSTOMER",

"DELETE_CUSTOMER",

"SEARCH_CUSTOMERS",



"ADD_LEAD",

"UPDATE_LEAD",

"DELETE_LEAD",

"SEARCH_LEADS",



"ADD_EXPENSE",

"SEARCH_EXPENSES",



"UPLOAD_BILL",

"GENERATE_REPORT",

"BOOK_SITE_VISIT",

"SEND_BROCHURE",



"GENERAL_CHAT"



];







if(

!allowed.includes(

result.intent

)

){



return {



intent:"GENERAL_CHAT",



confidence:0.5,



parameters:{}



};



}







return result;



}











// ============================================
// CONFIDENCE FILTER
//
// Low confidence -> General Chat
// ============================================


private confidenceGuard(

result:AIIntentResult

):AIIntentResult{





if(

result.confidence < 0.65

){



return {



intent:"GENERAL_CHAT",



confidence:0.5,



parameters:{



original:

result.parameters



}



};



}







return result;



}












// ============================================
// FINAL PROCESSOR
//
// Gemini/Fallback result cleanup
// ============================================


private finalizeResult(

result:AIIntentResult

):AIIntentResult{



let clean = {



intent:

result.intent || "GENERAL_CHAT",



confidence:

Number(

result.confidence || 0.5

),



parameters:

this.cleanParameters(

result.parameters || {}

)



};







clean =

this.validateIntent(

clean

);








clean =

this.confidenceGuard(

clean

);







return clean;



}












// ============================================
// OVERRIDE PARSE WITH SAFETY
//
// Production wrapper
// ============================================


async parseSafe(

message:string

):Promise<AIIntentResult>{



try{



const result =

await this.parseMessage(

message

);







return this.finalizeResult(

result

);





}

catch(error:any){



console.error(

"AI SAFE PARSER ERROR:",

error.message

);






return {



intent:"GENERAL_CHAT",



confidence:0.4,



parameters:{



error:

error.message



}



};



}



}












// ============================================
// TEST PARSER
//
// Internal debugging
// ============================================


async test(

message:string

){



const result =

await this.parseSafe(

message

);






return {



input:

message,



output:

result,



time:

new Date()

.toISOString()



};



}











// ============================================
// FINAL CLASS END
// ============================================


}



// ============================================
// EXPORT INSTANCE
// ============================================


export default new AIParserService();




// ============================================
// EXPORT CLASS
// ============================================


export {

AIParserService

};