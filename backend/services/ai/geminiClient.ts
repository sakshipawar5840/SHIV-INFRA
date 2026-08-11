// ============================================
// SHIVINFRA AI GEMINI CLIENT
// PRODUCTION CORE
// ============================================


import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";


dotenv.config();



// ============================================
// GEMINI INSTANCE
// ============================================


let aiClient: GoogleGenAI | null = null;



const apiKey = process.env.GEMINI_API_KEY;




// ============================================
// INITIALIZE GEMINI
// ============================================


if(
    apiKey &&
    apiKey !== "MY_GEMINI_API_KEY"
){

    try{


        aiClient = new GoogleGenAI({

            apiKey

        });



        console.log(
            "✅ SHIVINFRA AI GEMINI CONNECTED"
        );


    }
    catch(error:any){


        console.error(

            "❌ GEMINI INIT FAILED",

            error.message

        );


        aiClient = null;


    }


}
else{


    console.log(

        "⚠️ GEMINI KEY NOT FOUND - AI FALLBACK MODE"

    );


}








// ============================================
// CHECK AI STATUS
// ============================================


export const isAIAvailable = ()=>{


    return aiClient !== null;


};








// ============================================
// SEND PROMPT TO GEMINI
// ============================================


export async function askGemini(

prompt:string

){



    if(!aiClient){


        throw new Error(

            "Gemini not connected"

        );


    }




    try{


        const result =

        await aiClient.models.generateContent({


            model:

            String(process.env.GEMINI_MODEL || "gemini-flash-latest").trim(),



            contents:

            prompt


        });





        return result.text || "";



    }
    catch(error:any){


        console.error(

            "GEMINI ERROR",

            error.message

        );



        throw error;



    }



}





export default aiClient;