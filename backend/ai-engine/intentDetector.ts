// =====================================================
// SHIVINFRA AI
// INTENT DETECTOR ENGINE
// =====================================================


import { GoogleGenAI } from "@google/genai";



// =====================================================
// AI CLIENT
// =====================================================


const apiKey = process.env.GEMINI_API_KEY;



let aiClient:any = null;



if(
    apiKey &&
    apiKey !== "MY_GEMINI_API_KEY"
){



    aiClient = new GoogleGenAI({

        apiKey

    });



}



// =====================================================
// INTENT TYPES
// =====================================================


export interface AIIntent {



    name:string;



    action:string;



    entity:string;



    parameters:any;



    confidence?:number;



}



// =====================================================
// MAIN INTENT DETECTOR
// =====================================================


export async function detectIntent(
    message:string
):Promise<AIIntent>{



    try{






        if(aiClient){



            const prompt = `

You are SHIVINFRA AI Construction ERP Intent Engine.

Understand user message in Marathi, English, Hindi or Hinglish.

Return ONLY JSON.

CRITICAL CLASSIFICATION RULES:

1. If the message mentions "project", "building", "construction", "site", "tower", "flat", "unit", "sqft", "bhk", "possession", "villa", "plot" → it is a PROJECT operation.

2. If the message mentions "customer", "client", "buyer", "person" or a person name with "budget", "phone", "mobile", "email", "address", "city", "status" → it is a CUSTOMER operation.

3. "Update/Change <name> budget/phone/email/address/city/status" without project keywords → UPDATE_CUSTOMER.

4. "Delete/Remove <name>" without project keywords → DELETE_CUSTOMER.

5. "Show/Find/Search <name>" without project keywords → SEARCH_CUSTOMERS.

6. Never classify a customer operation as a project operation just because "budget", "price", "amount", "update" or "change" appears.

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
UPDATE_LEAD
DELETE_LEAD

ADD_EXPENSE
SEARCH_EXPENSES
UPDATE_EXPENSE
DELETE_EXPENSE

UPLOAD_BILL
SEARCH_BILLS
UPDATE_BILL
DELETE_BILL

GENERATE_REPORT
GENERAL_CHAT

JSON format:

{
"name":"",
"action":"",
"entity":"",
"parameters":{},
"confidence": 0.0
}

Extract as many parameters as possible from the message.

User message:
${message}
`;



            const response =
            await aiClient.models.generateContent({

                model:
                process.env.GEMINI_MODEL ||
                "gemini-flash-latest",

                contents:prompt

            });



            const text =
            response.text;



            const cleaned =
            text.replace(
                /```json|```/g,
                ""
            );



            const parsed =
            JSON.parse(
                cleaned
            );



    // MULTI-LINGUAL: generic "dakhav" (show) → SEARCH_PROJECTS
    // Specific entity checks (expense dakhav, bill dakhav, etc.) above take priority
    if(
        text.includes("dakhav")
    ){

        return {

            name:"SEARCH_PROJECTS",

            action:"SEARCH",

            entity:"PROJECT",

            parameters:extractSearchQuery(message, [
                "dakhav"
            ]),

            confidence:0.7

        };

    }
    const result =
    correctIntent(
        message,
        {

            name:
            String(
                parsed.name || "GENERAL_CHAT"
            )
            .trim()
            .toUpperCase(),

            action:
            String(
                parsed.action || "CHAT"
            )
            .trim()
            .toUpperCase(),

            entity:
            String(
                parsed.entity || "AI"
            )
            .trim()
            .toUpperCase(),

            parameters:
            parsed.parameters || {},

            confidence:
            Number(
                parsed.confidence || 0.9
            )
        }
    );
    return result;


    }

    const fallbackResult = fallbackIntent(message);


















    }
    catch(error){



        console.log(
            "Intent Error",
            error
        );



        return fallbackIntent(message);



    }



}



// =====================================================
// OFFLINE FALLBACK
// =====================================================


function isProjectContext(
    text:string
):boolean{




    const projectKeywords = [




        "project",




        "building",




        "construction",




        "site",




        "tower",




        "flat",




        "unit",




        "sqft",




        "bhk",




        "possession",




        "villa",




        "plot"




    ];




    return projectKeywords.some(
        keyword => text.includes(keyword)
    );




}




function correctIntent(
    message:string,
    intent:AIIntent
):AIIntent{




    const text =
    message
    .toLowerCase()
    .trim();






    const name =
    String(intent.name || "GENERAL_CHAT").toUpperCase().trim();

    // If project context exists and Gemini detected a project intent, trust it
    if(isProjectContext(text) && name !== "GENERAL_CHAT"){
        return intent;
    }

    // Detect strong business signals
    const hasCustomerField =
        text.includes("budget") || text.includes("phone") || text.includes("mobile") ||
        text.includes("email") || text.includes("address") || text.includes("city") ||
        text.includes("status");

    const hasAction =
        text.includes("update") || text.includes("change") || text.includes("edit");

    const hasDelete =
        text.includes("delete") || text.includes("remove");

    const hasShow =
        text.includes("show") || text.includes("find") || text.includes("search") ||
        text.includes("list");

    // Customer update/change without project keywords
    if(hasAction && hasCustomerField && !isProjectContext(text)){
        return { ...intent, name: "UPDATE_CUSTOMER", action: "UPDATE", entity: "CUSTOMER", parameters: extractCustomerUpdateData(message), confidence: Math.max(intent.confidence || 0.8, 0.8) };
    }

    // Customer delete/remove without project keywords
    if(hasDelete && !isProjectContext(text)){
        return { ...intent, name: "DELETE_CUSTOMER", action: "DELETE", entity: "CUSTOMER", parameters: extractCustomerNameForDelete(message), confidence: Math.max(intent.confidence || 0.8, 0.8) };
    }

    // Show/Find/Search without project keywords
    if(hasShow && !isProjectContext(text)){
        return { ...intent, name: "SEARCH_CUSTOMERS", action: "SEARCH", entity: "CUSTOMER", parameters: {}, confidence: Math.max(intent.confidence || 0.8, 0.8) };
    }

    // Project context with update/change but Gemini said general chat
    if(isProjectContext(text) && hasAction){
        return { ...intent, name: "UPDATE_PROJECT", action: "UPDATE", entity: "PROJECT", parameters: extractUpdateData(message), confidence: Math.max(intent.confidence || 0.7, 0.7) };
    }

    // Project context with show/search but Gemini said general chat
    if(isProjectContext(text) && hasShow){
        return { ...intent, name: "SEARCH_PROJECTS", action: "SEARCH", entity: "PROJECT", parameters: extractSearchQuery(message, ["project", "projects"]), confidence: Math.max(intent.confidence || 0.8, 0.8) };
    }

    return intent;
}









































































































































































































































function fallbackIntent(
    message:string
):AIIntent{



    const text =
    message
    .toLowerCase()
    .trim();



    // PROJECT CREATE

    if(
        text.includes("add project") ||
        text.includes("create project") ||
        text.includes("new project") ||
        text.includes("project add") ||
        text.includes("project create") ||
        text.includes("project banav") ||
        text.includes("project tayar kar")
    ){



        return {



            name:"ADD_PROJECT",

            action:"CREATE",

            entity:"PROJECT",

            parameters:extractProjectData(message),

            confidence:0.8



        };



    }



    // PROJECT SEARCH

    if(
        text.includes("show project") ||
        text.includes("find project") ||
        text.includes("search project") ||
        text.includes("projects") && !text.includes("add") ||
        text.includes("project details") ||
        text.includes("project chi details") ||
        text.includes("project dakhav") ||
        text.includes("projects dakhav") ||
        text.includes("mujhe project") ||
        text.includes("mujhe projects") ||
        text.includes("cha price kay") ||
        text.includes("chi price kay") ||
        text.includes("cha rate kay") ||
        text.includes("rate kay ahe") ||
        text.includes("price kay ahe") ||
        text.includes("cha details") ||
        text.includes("chi details")
    ){



        return {



            name:"SEARCH_PROJECTS",

            action:"SEARCH",

            entity:"PROJECT",

            parameters:extractSearchQuery(message, [

                "project",

                "projects"

            ]),

            confidence:0.8



        };



    }



    // CUSTOMER SEARCH (without explicit "customer" keyword)

    if(
        !isProjectContext(text) &&
        (
            text.includes("show") ||
            text.includes("find") ||
            text.includes("search") ||
            text.includes("list")
        ) &&
        !text.includes("project")
    ){




        return {




            name:"SEARCH_CUSTOMERS",




            action:"SEARCH",




            entity:"CUSTOMER",




            parameters:{
                name:
                extractCustomerNameForDelete(message)
            },




            confidence:0.8




        };




    }




    // CUSTOMER UPDATE (without explicit "customer" keyword)

    if(
        !isProjectContext(text) &&
        (
            text.includes("update") ||
            text.includes("change") ||
            text.includes("edit")
        ) &&
        (
            text.includes("budget") ||
            text.includes("price") ||
            text.includes("phone") ||
            text.includes("mobile") ||
            text.includes("email") ||
            text.includes("address") ||
            text.includes("city") ||
            text.includes("status") ||
            /update\s+\w+/.test(text) ||
            /change\s+\w+/.test(text)
        )
    ){




        return {




            name:"UPDATE_CUSTOMER",




            action:"UPDATE",




            entity:"CUSTOMER",




            parameters:extractCustomerUpdateData(message),




            confidence:0.8




        };




    }




    // PROJECT UPDATE

    if(
        text.includes("update project") ||
        text.includes("edit project") ||
        text.includes("project update") ||
        text.includes("project change") ||
        text.includes("project badal") ||
        text.includes("project update kar") ||
        text.includes("price") && (text.includes("update") || text.includes("change") || text.includes("badal") || text.includes("kar")) ||
        (text.includes("cha price") && text.includes("kar")) ||
        text.includes("la price") ||
        text.includes("chi value") ||
        (text.includes("status") && (text.includes("update") || text.includes("change") || text.includes("badal") || text.includes("kar")))
    ){



        return {



            name:"UPDATE_PROJECT",

            action:"UPDATE",

            entity:"PROJECT",

            parameters:extractUpdateData(message),

            confidence:0.7



        };



    }



    // CUSTOMER DELETE (without explicit "customer" keyword)

    if(
        !isProjectContext(text) &&
        (
            text.includes("delete") ||
            text.includes("remove")
        ) &&
        (
            /delete\s+\w+/.test(text) ||
            /remove\s+\w+/.test(text)
        )
    ){




        return {




            name:"DELETE_CUSTOMER",




            action:"DELETE",




            entity:"CUSTOMER",




            parameters:extractCustomerNameForDelete(message),




            confidence:0.8




        };




    }




    // PROJECT DELETE

    if(
        text.includes("delete project") ||
        text.includes("remove project") ||
        text.includes("project delete") ||
        text.includes("project remove") ||
        text.includes("project delete kar") ||
        text.includes("project remove kar") ||
        (text.includes("delete") && text.includes("project")) ||
        (text.includes("remove") && text.includes("project")) ||
        text.includes("delete kar") ||
        text.includes("remove kar") ||
        text.includes("delete kara") ||
        text.includes("remove kara")
    ){



        return {



            name:"DELETE_PROJECT",

            action:"DELETE",

            entity:"PROJECT",

            parameters:extractProjectName(message),

            confidence:0.8



        };



    }



    // CUSTOMER CREATE

    if(
        text.includes("add customer") ||
        text.includes("create customer") ||
        text.includes("new customer") ||
        text.includes("customer add") ||
        text.includes("customer create") ||
        text.includes("customer banav")
    ){



        return {



            name:"ADD_CUSTOMER",

            action:"CREATE",

            entity:"CUSTOMER",

            parameters:extractCustomerData(message),

            confidence:0.8



        };



    }



    // CUSTOMER SEARCH

    if(
        text.includes("show customer") ||
        text.includes("find customer") ||
        text.includes("search customer") ||
        text.includes("customers") && !text.includes("add") ||
        text.includes("customer details") ||
        text.includes("customer dakhav")
    ){



        return {



            name:"SEARCH_CUSTOMERS",

            action:"SEARCH",

            entity:"CUSTOMER",

            parameters:{},

            confidence:0.8



        };



    }



    // LEAD CREATE

    if(
        text.includes("add lead") ||
        text.includes("create lead") ||
        text.includes("new lead") ||
        text.includes("lead add") ||
        text.includes("enquiry") ||
        text.includes("inquiry") ||
        text.includes("lead create") ||
        text.includes("enquiry create") ||
        text.includes("pahije") ||
        text.includes("chahiye") ||
        text.includes("property") && (text.includes("required") || text.includes("need") || text.includes("want")) ||
        /(\d)\s*BHK/i.test(text) ||
        text.includes("budget")
    ){



        return {



            name:"ADD_LEAD",

            action:"CREATE",

            entity:"LEAD",

            parameters:extractLeadData(message),

            confidence:0.8



        };



    }



    // LEAD SEARCH

    if(
        text.includes("show lead") ||
        text.includes("find lead") ||
        text.includes("search lead") ||
        text.includes("leads") && !text.includes("add") ||
        text.includes("lead details") ||
        text.includes("lead dakhav") ||
        text.includes("leads dakhav")
    ){



        return {



            name:"SEARCH_LEADS",

            action:"SEARCH",

            entity:"LEAD",

            parameters:{},

            confidence:0.8



        };



    }



    // EXPENSE CREATE

    if(
        text.includes("add expense") ||
        text.includes("create expense") ||
        text.includes("new expense") ||
        text.includes("expense add") ||
        text.includes("expense create") ||
        text.includes("kharch add") ||
        text.includes("expense add kar") ||
        text.includes("kharch add kar")
    ){



        return {



            name:"ADD_EXPENSE",

            action:"CREATE",

            entity:"EXPENSE",

            parameters:extractExpenseData(message),

            confidence:0.8



        };



    }



    // EXPENSE SEARCH

    if(
        text.includes("show expense") ||
        text.includes("find expense") ||
        text.includes("search expense") ||
        text.includes("expense list") ||
        text.includes("expenses") && !text.includes("add") ||
        text.includes("expense details") ||
        text.includes("expense dakhav") ||
        text.includes("kharch dakhav")
    ){



        return {



            name:"SEARCH_EXPENSES",

            action:"SEARCH",

            entity:"EXPENSE",

            parameters:{},

            confidence:0.8



        };



    }



    // BILL UPLOAD

    if(
        text.includes("upload bill") ||
        text.includes("add bill") ||
        text.includes("create bill") ||
        text.includes("new bill") ||
        text.includes("bill add") ||
        text.includes("bill upload") ||
        text.includes("bill create") ||
        text.includes("upload invoice")
    ){



        return {



            name:"UPLOAD_BILL",

            action:"CREATE",

            entity:"BILL",

            parameters:extractBillData(message),

            confidence:0.8



        };



    }



    // BILL SEARCH

    if(
        text.includes("show bill") ||
        text.includes("find bill") ||
        text.includes("search bill") ||
        text.includes("bills") && !text.includes("add") && !text.includes("upload") ||
        text.includes("bill details") ||
        text.includes("bill dakhav") ||
        text.includes("bill kay ahe") ||
        text.includes("last bill")
    ){



        return {



            name:"SEARCH_BILLS",

            action:"SEARCH",

            entity:"BILL",

            parameters:{},

            confidence:0.8



        };



    }



    // REPORT

    if(
        text.includes("generate report") ||
        text.includes("create report") ||
        text.includes("report") ||
        text.includes("report generate") ||
        text.includes("report banav") ||
        text.includes("report tayar kar")
    ){



        return {



            name:"GENERATE_REPORT",

            action:"GENERATE",

            entity:"REPORT",

            parameters:extractReportData(message),

            confidence:0.7



        };



    }



    return {



        name:"GENERAL_CHAT",

        action:"CHAT",

        entity:"AI",

        parameters:{},

        confidence:0.5



    };



}



// =====================================================
// PROJECT DATA EXTRACTION
// =====================================================


function extractProjectData(
    message:string
):any{



    const cleaned =
    message
    .replace(
        /add project|create project|new project|project add|project create|project banav|project tayar kar/gi,
        ""
    )
    .trim();



    const locationMatch =
    message.match(
        /(?:at|in|madhe|madhye|me|par)\s+([A-Za-z0-9\s]+?)(?:\s+project|\s+type|\s+bhk|\s+sqft|\s+price|\s+crore|\s+lakh|\s+\d|$)/i
    );



    const priceMatch =
    message.match(
        /(\d+)\s*(?:lakh|lac|cr|crore|lakhs|crores)/i
    );



    const typeMatch =
    message.match(
        /(\d+)\s*(?:bhk|BHK|flat|villa|penthouse)/i
    );



    let price:number | null = null;



    if(priceMatch){



        const value =
        Number(priceMatch[1]);



        const unit =
        priceMatch[2]
        ?
        priceMatch[2]
        .toLowerCase()
        :
        "";



        if(
            unit.startsWith("cr") ||
            unit.startsWith("crore")
        ){



            price =
            value * 10000000;



        }
        else if(
            unit.startsWith("lakh") ||
            unit.startsWith("lac")
        ){



            price =
            value * 100000;



        }



    }



    return {



        project_name:
        cleaned || "New Project",

        location:
        locationMatch ?
        locationMatch[1].trim() :
        null,

        project_type:
        typeMatch ?
        typeMatch[0].trim() :
        null,

        price:
        price,

        city:
        null,

        status:
        "Ongoing"



    };



}



// =====================================================
// SEARCH QUERY EXTRACTION
// =====================================================


function extractSearchQuery(
    message:string,
    keywords:string[]
):any{



    let query =
    message;



    for(const word of keywords){



        query =
        query.replace(
            new RegExp(
                word,
                "gi"
            ),
            ""

        );



    }



    return {



        query:
        query.trim()



    };



}



// =====================================================
// UPDATE DATA EXTRACTION
// =====================================================

function extractUpdateData(
    message:string
):any{

    const params:any = {};

    const cleaned =
    message
    .replace(
        /update project|edit project|project update|project change|project badal|project update kar|update|change|badal/gi,
        ""
    )
    .trim();

    const priceMatch =
    message.match(
        /(?:price|amount|kimat|daam)\s*(?:to|ka|la|ke|chi|cha|la|kar|ho)?\s*(\d+)\s*(lakh|lac|cr|crore)?/i
    );


    if(priceMatch){


        let price =
        Number(priceMatch[1]);


        if(priceMatch[2]){


            const unit =
            priceMatch[2]
            .toLowerCase();


            if(
                unit.startsWith("cr") ||
                unit.startsWith("crore")
            ){


                price *=
                10000000;



            }
            else if(
                unit.startsWith("lakh") ||
                unit.startsWith("lac")
            ){


                price *=
                100000;



            }


        }


        params.price =
        price;


    }


    const projectName =
    cleaned
    .replace(
        /price|amount|kimat|daam|to|kar|ke|ka|la|chi|cha|ho|\d+\s*(lakh|lac|cr|crore)?/gi,
        ""
    )
    .replace(/\s+/g, " ")
    .trim();


    if(projectName){

        params.project_name =
        projectName;

    }


    return params;


}



function extractProjectName(
    message:string
):any{



    const cleaned =
    message
    .replace(
        /delete project|remove project|project delete|project remove|project delete kar|project remove kar|delete|remove|project/gi,
        ""
    )
    .trim();



    return {



        project_name:
        cleaned



    };



}



// =====================================================
// CUSTOMER DATA EXTRACTION
// =====================================================


function extractCustomerData(
    message:string
):any{



    const cleaned =
    message
    .replace(
        /add customer|create customer|new customer|customer add|customer create|customer banav/gi,
        ""
    )
    .trim();



    const phoneMatch =
    message.match(
        /(\d{10})/
    );



    const emailMatch =
    message.match(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    );


    let nameOnly =
    cleaned
    .replace(
        /\b(phone|mobile|number|contact)\b.*?\d{10}/gi,
        ""
    )
    .replace(
        /\d{10}/g,
        ""
    )
    .replace(
        /\b(phone|mobile|number|contact)\b/gi,
        ""
    )
    .replace(
        /[,\-]+/g,
        " "
    )
    .replace(
        /\s+/g,
        " "
    )
    .trim();




    return {




        full_name:
        nameOnly || "WhatsApp Customer",

        phone:
        phoneMatch ?
        phoneMatch[1] :
        null,

        email:
        emailMatch ?
        emailMatch[1] :
        null,

        status:
        "active",

        source:
        "WhatsApp"



    };


}




function extractCustomerUpdateData(
    message:string
):any{




    const params:any = {};




    const name =
    extractCustomerNameForDelete(message);




    if(name){




        params.name =
        name;




    }




    const phoneMatch =
    message.match(
        /(\d{10})/
    );




    if(phoneMatch){




        params.phone =
        phoneMatch[1];




    }




    const amountMatch =
    message.match(
        /(\d+(?:\.\d+)?)\s*(crore|cr|lakh|lac|lakhs|thousand|k)?/i
    );




    if(amountMatch){




        let value =
        Number(amountMatch[1]);




        const unit =
        amountMatch[2]
        ?
        amountMatch[2].toLowerCase()
        :
        "";




        if(
            unit==="crore"
            ||
            unit==="cr"
        ){




            value *=
            10000000;




        }
        else if(
            unit==="lakh"
            ||
            unit==="lac"
            ||
            unit==="lakhs"
        ){




            value *=
            100000;




        }
        else if(
            unit==="thousand"
            ||
            unit==="k"
        ){




            value *=
            1000;




        }




        if(
            value > 0
            &&
            value < 100000000
        ){




            params.budget =
            value;




        }




    }




    if(
        message.toLowerCase().includes("email")
    ){




        const emailMatch =
        message.match(
            /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
        );




        if(emailMatch){




            params.email =
            emailMatch[1];




        }




    }




    if(
        message.toLowerCase().includes("address")
    ){




        const addressMatch =
        message.match(
            /address[:\s]+([A-Za-z0-9\s,]+?)(?:\s+city|\s+status|\s+phone|\s+email|\s+budget|\s+update|\s+change|\s+to|\s+kar|\s+ho|\s+ha|\s+aahe|$)/i
        );




        if(addressMatch){




            params.address =
            addressMatch[1].trim();




        }




    }




    if(
        message.toLowerCase().includes("city")
        ||
        message.toLowerCase().includes("location")
    ){




        const cityMatch =
        message.match(
            /(?:city|location)[:\s]+([A-Za-z0-9\s]+?)(?:\s+phone|\s+email|\s+budget|\s+update|\s+change|\s+to|\s+kar|\s+ho|\s+ha|\s+aahe|$)/i
        );




        if(cityMatch){




            params.city =
            cityMatch[1].trim();




        }




    }




    if(
        message.toLowerCase().includes("status")
    ){




        const statusMatch =
        message.match(
            /status[:\s]+(active|inactive|ongoing|completed|new|hot|warm|cold)/i
        );




        if(statusMatch){




            params.status =
            statusMatch[1].charAt(0).toUpperCase()
            +
            statusMatch[1].slice(1).toLowerCase();




        }




    }




    return params;




}




function extractCustomerNameForDelete(
    message:string
):string{




    let cleaned =
    message
    .replace(
        /\b(?:delete|remove|client|project|please|kindly|krupaya|kripa|update|change|edit|set|budget|price|phone|mobile|email|address|city|status|amount|to|ka|chi|cha|la|for|hai|ha|aahe|ho|kar|banav|tayar|show|find|search|list)\b/gi,
        ""
    )
    .replace(
        /\b\d+(?:\.\d+)?\b/g,
        ""
    )
    .replace(
        /[,\-]+/g,
        " "
    )
    .replace(
        /\s+/g,
        " "
    )
    .trim();




    return cleaned;




}




// =====================================================
// LEAD DATA EXTRACTION
// =====================================================


function extractLeadData(
    message:string
):any{



    const cleaned =
    message
    .replace(
        /add lead|create lead|new lead|lead add|lead create|enquiry|inquiry|enquiry create/gi,
        ""
    )
    .trim();



    const phoneMatch =
    message.match(
        /(\d{10})/
    );



    const budgetMatch =
    message.match(
        /(\d+)\s*(lakh|lac|cr|crore)/i
    );



    let budget:number | null = null;



    if(budgetMatch){



        budget =
        Number(budgetMatch[1]);



        if(budgetMatch[2]){



            const unit =
            budgetMatch[2]
            .toLowerCase();



            if(
                unit.startsWith("cr") ||
                unit.startsWith("crore")
            ){



                budget *=
                10000000;



            }
            else if(
                unit.startsWith("lakh") ||
                unit.startsWith("lac")
            ){



                budget *=
                100000;



            }



        }



    }
    else{



        const allNumbers =
        message.match(
            /(\d+)\s*(lakh|lac|cr|crore|\/)?/gi
        );



        if(
            Array.isArray(allNumbers)
        ){



            const lastNumberMatch =
            allNumbers[allNumbers.length - 1]
            .match(/(\d+)/);



            if(
                lastNumberMatch
            ){



                budget =
                Number(
                    lastNumberMatch[1]
                );



                if(
                    allNumbers[allNumbers.length - 1]
                    .toLowerCase()
                    .includes("lakh") ||
                    allNumbers[allNumbers.length - 1]
                    .toLowerCase()
                    .includes("lac")
                ){



                    budget *=
                    100000;



                }
                else if(
                    allNumbers[allNumbers.length - 1]
                    .toLowerCase()
                    .includes("cr") ||
                    allNumbers[allNumbers.length - 1]
                    .toLowerCase()
                    .includes("crore")
                ){



                    budget *=
                    10000000;



                }



            }



        }



    }



    return {



        requirement:
        cleaned || message,

        budget:
        budget,

        lead_source:
        "WhatsApp",

        status:
        "New",

        remarks:
        "Created by SHIVINFRA AI"



    };



}



// =====================================================
// EXPENSE DATA EXTRACTION
// =====================================================


function extractExpenseData(
    message:string
):any{



    const amountMatch =
    message.match(
        /(\d+)\s*(?:rupees|rs|₹)?/i
    );



    return {



        expense_title:
        message
        .replace(
            /add expense|create expense|new expense|expense add|expense create|kharch add/gi,
            ""
        )
        .trim() || "Expense",

        amount:
        amountMatch ?
        Number(amountMatch[1]) :
        null,

        expense_category:
        "General",

        payment_method:
        "Cash",

        remarks:
        "Created by SHIVINFRA AI"



    };



}



// =====================================================
// BILL DATA EXTRACTION
// =====================================================


function extractBillData(
    message:string
):any{



    const amountMatch =
    message.match(
        /(\d+)\s*(?:rupees|rs|₹)?/i
    );



    return {



        vendor_name:
        "Unknown Vendor",

        material_name:
        "Unknown Material",

        amount:
        amountMatch ?
        Number(amountMatch[1]) :
        0,

        bill_number:
        `BILL-${Date.now()}`,

        bill_date:
        new Date()
        .toISOString()
        .split("T")[0],

        payment_status:
        "Pending",

        remarks:
        "Created by SHIVINFRA AI"



    };



}



// =====================================================
// REPORT DATA EXTRACTION
// =====================================================


function extractReportData(
    message:string
):any{



    const typeMatch =
    message.match(
        /(finance|leads|inventory|audit|project|customer)/i
    );



    return {



        report_type:
        typeMatch ?
        typeMatch[1]
        .toUpperCase() :
        "FINANCE",

        file_format:
        "PDF"



    };



}
