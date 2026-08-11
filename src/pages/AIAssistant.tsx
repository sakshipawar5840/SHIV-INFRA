// ============================================
// SHIVINFRA AI ASSISTANT V2
// PRODUCTION FRONTEND AI AGENT
// PART 1 / 4
// ============================================


import React, {
    useState,
    useRef
} from "react";


import {
    Send,
    Brain,
    Bot,
    Circle,
    Cpu,
    Paperclip,
    AlertCircle
} from "lucide-react";




// ============================================
// TYPES
// ============================================


interface ChatMessage {


    id:string;


    sender:
    |
    "ai"
    |
    "user";


    text:string;


    timestamp:string;


    intent?:string;


    success?:boolean;


}





interface AIResponse {


    success:boolean;


    message?:string;


    response?:string;


    intent?:{

        intent:string;

        confidence:number;

        parameters:any;

    };


    action?:{

        success:boolean;

        message:string;

        data?:any;

    };


}






// ============================================
// API CONFIG
// ============================================


const API_URL =

import.meta.env.VITE_API_URL ||

"http://localhost:3000/api/v1";







// ============================================
// AUTH TOKEN
// ============================================


const getAuthToken =()=>{


    return (

        localStorage.getItem(
            "token"
        )

    );


};








// ============================================
// AI API SERVICE
// ============================================


const callAI = async(

    message:string,

    sessionId:string

):Promise<AIResponse>=>{


    try{


        const token = getAuthToken();



        const controller =

        new AbortController();



        const timeout =

        setTimeout(()=>{

            controller.abort();

        },30000);






        const response = await fetch(


            `${API_URL}/ai/chat`,


            {


                method:"POST",



                headers:{


                    "Content-Type":
                    "application/json",



                    ...(token && {


                        Authorization:

                        `Bearer ${token}`


                    })


                },



                body:JSON.stringify({


                    message,


                    session_id:

                    sessionId,



                    channel:

                    "WEB"


                }),



                signal:

                controller.signal


            }



        );




        clearTimeout(timeout);





        const data =

        await response.json();





        return data;



    }

    catch(error:any){


        console.error(

            "SHIVINFRA AI ERROR",

            error

        );



        return {


            success:false,


            message:


            error.name==="AbortError"

            ?

            "AI request timeout"

            :

            "AI service unavailable"



        };


    }



};









// ============================================
// COMPONENT
// ============================================


const AIAssistant:React.FC =()=>{





const sessionId =

useRef(

`shivinfra_${Date.now()}`

);







const [messages,setMessages] =

useState<ChatMessage[]>([


    {


        id:"welcome",


        sender:"ai",


        text:


        "Hello 👋 I am SHIVINFRA AI Agent. I can manage Projects, Customers, Leads, Bills, Expenses, Reports and WhatsApp automation.",



        timestamp:"Now",


        success:true


    }



]);








const [inputText,setInputText] =

useState("");







const [loading,setLoading] =

useState(false);






const [error,setError] =

useState("");









// ============================================
// TIME FORMAT
// ============================================


const getTime=()=>{


return new Date()

.toLocaleTimeString(

[],

{

hour:"2-digit",

minute:"2-digit"

}

);


};









// ============================================
// SEND MESSAGE
// ============================================


const handleSendMessage = async(

customMessage?:string

)=>{



const message =

customMessage ||

inputText.trim();





if(!message)

return;






setError("");







const userMessage:ChatMessage={



id:

`user_${Date.now()}`,



sender:"user",



text:

message,



timestamp:

getTime()



};








setMessages(prev=>[

...prev,

userMessage

]);







setInputText("");




setLoading(true);





const result = await callAI(

message,

sessionId.current

);





console.log(

"AI RESPONSE",

result

);





if(result.success){



const aiMessage:ChatMessage={



id:

`ai_${Date.now()}`,



sender:"ai",



text:


result.response ||


result.message ||


"AI completed successfully",




timestamp:

getTime(),




intent:

result.intent?.intent,



success:true



};






setMessages(prev=>[

...prev,

aiMessage

]);



}

else{


setError(

result.message ||

"AI failed"

);



}






setLoading(false);





};
// ============================================
// PART 2 / 4
// HEADER + COMMAND PANEL
// ============================================




// ============================================
// QUICK COMMANDS
// ============================================


const quickCommands = [


    {
        title:"Search Projects",
        message:
        "Show available projects in Pune"
    },


    {
        title:"Add Project",
        message:
        "Add new project with details"
    },


    {
        title:"Search Customers",
        message:
        "Show customers list"
    },


    {
        title:"Today's Leads",
        message:
        "Show today's leads"
    },


    {
        title:"Generate Report",
        message:
        "Generate monthly business report"
    },


    {
        title:"Check Expenses",
        message:
        "Show current expenses"
    }


];








// ============================================
// BILL OCR UPLOAD
// ============================================


const handleFileUpload = (

event:
React.ChangeEvent<HTMLInputElement>

)=>{


const file =

event.target.files?.[0];



if(!file)

return;




const message =


`Upload bill for OCR processing. File: ${file.name}`;





handleSendMessage(message);



};







// ============================================
// USER ROLE
// ============================================


const role =

localStorage.getItem("role")

||

"ADMIN";







// ============================================
// UI RETURN START
// ============================================


return (

<div

className="

h-[calc(100vh-6rem)]

flex

flex-col

space-y-5

text-slate-100

font-sans

"

>





{/* =====================================
AI HEADER
===================================== */}



<div


className="

bg-slate-900

border

border-slate-800

rounded-2xl

p-5

flex

justify-between

items-center

gap-4

"

>



<div

className="flex items-center gap-4"

>



<div


className="

h-12

w-12

rounded-xl

bg-sky-500/10

border

border-sky-500/30

flex

items-center

justify-center

"

>



<Brain

size={26}

className="text-sky-400 animate-pulse"

/>



</div>







<div>


<h1

className="

text-lg

font-bold

tracking-wide

"

>

SHIVINFRA AI Agent

</h1>




<p

className="

text-xs

text-slate-400

"

>

Construction ERP + CRM Intelligence Engine

</p>



</div>



</div>









<div

className="

flex

flex-wrap

gap-2

justify-end

"

>




<span

className="

flex

items-center

gap-1

px-3

py-1

rounded-full

bg-emerald-500/10

border

border-emerald-500/20

text-emerald-400

text-xs

"

>


<Circle

size={8}

className="fill-emerald-400"

/>


AI Online


</span>








<span

className="

px-3

py-1

rounded-full

bg-purple-500/10

border

border-purple-500/20

text-purple-400

text-xs

"

>


{role}


</span>







<span

className="

px-3

py-1

rounded-full

bg-blue-500/10

border

border-blue-500/20

text-blue-400

text-xs

"

>

Gemini Engine

</span>




</div>





</div>









{/* =====================================
MAIN GRID
===================================== */}



<div


className="

flex-1

grid

grid-cols-1

lg:grid-cols-4

gap-5

min-h-0

"

>







{/* =====================================
COMMAND PANEL
===================================== */}



<div


className="

bg-slate-900

border

border-slate-800

rounded-2xl

p-4

overflow-y-auto

"

>



<h3


className="

text-xs

font-bold

uppercase

tracking-widest

text-slate-400

mb-4

"

>


AI Commands


</h3>







<div

className="space-y-3"

>


{


quickCommands.map(

(command,index)=>(



<button


key={index}


onClick={()=>


handleSendMessage(

command.message

)

}



className="

w-full

text-left

p-3

rounded-xl

bg-slate-950

border

border-slate-800

hover:border-sky-500

transition

text-xs

text-slate-300

"

>



<div

className="

flex

items-center

gap-2

"

>



<Cpu

size={14}

className="text-sky-400"

/>



{command.title}



</div>




</button>



)



)

}



</div>








{/* =====================================
OCR UPLOAD
===================================== */}



<label


className="

mt-5

flex

items-center

gap-2

cursor-pointer

p-3

rounded-xl

bg-orange-500/10

border

border-orange-500/20

text-orange-400

text-xs

"

>



<Paperclip

size={15}

/>


Upload Bill OCR




<input


type="file"


hidden


accept="image/*,.pdf"


onChange={handleFileUpload}


/>



</label>





</div>






// ============================================
// PART 3 / 4
// CHAT WINDOW
// ============================================




{/* =====================================
ERROR MESSAGE
===================================== */}



{

error && (


<div


className="

flex

items-center

gap-2

bg-red-500/10

border

border-red-500/20

text-red-400

p-3

rounded-xl

text-xs

"

>


<AlertCircle size={15}/>


{error}


</div>


)

}









{/* =====================================
CHAT PANEL
===================================== */}



<div


className="

lg:col-span-3

bg-slate-900

border

border-slate-800

rounded-2xl

flex

flex-col

overflow-hidden

"

>








{/* =====================================
MESSAGES AREA
===================================== */}



<div


className="

flex-1

overflow-y-auto

p-5

space-y-5

bg-slate-950/30

"

>





{


messages.map(

(message)=>{


const isAI =

message.sender==="ai";





return (


<div


key={message.id}


className={

`

flex

gap-3

${

isAI

?

"justify-start"

:

"justify-end"

}

`

}


>








{/* AI ICON */}



{

isAI && (


<div


className="

h-9

w-9

rounded-xl

bg-sky-500/10

border

border-sky-500/20

flex

items-center

justify-center

shrink-0

"

>


<Bot

size={18}

className="text-sky-400"

/>


</div>


)

}









{/* MESSAGE BOX */}



<div


className={

`

max-w-[80%]

rounded-2xl

p-4

text-sm

leading-relaxed

whitespace-pre-line


${


isAI


?


"bg-slate-900 border border-slate-800 text-slate-200"


:


"bg-sky-600 text-white"



}

`

}


>




<p>


{message.text}


</p>








{/* INTENT DISPLAY */}



{


message.intent && (


<div


className="

mt-3

text-[10px]

text-sky-400

font-mono

border-t

border-slate-700

pt-2

"

>


Intent:

{message.intent}



</div>


)

}







<span


className="

block

text-[10px]

opacity-50

mt-2

text-right

"


>


{message.timestamp}


</span>





</div>









{/* USER ICON */}



{


!isAI && (


<div


className="

h-9

w-9

rounded-full

bg-slate-800

border

border-slate-700

flex

items-center

justify-center

font-bold

text-xs

"

>


U


</div>


)


}







</div>



)


}


)

}









{/* =====================================
AI THINKING
===================================== */}



{

loading && (


<div


className="

flex

items-center

gap-3

"

>




<div


className="

h-9

w-9

rounded-xl

bg-sky-500/10

border

border-sky-500/20

flex

items-center

justify-center

animate-pulse

"

>


<Bot

size={18}

className="text-sky-400"

/>


</div>







<div


className="

bg-slate-900

border

border-slate-800

px-4

py-3

rounded-xl

text-xs

text-slate-400

"

>



SHIVINFRA AI is thinking...




</div>







</div>


)

}






</div>





// ============================================
// PART 4 / 4
// INPUT + FOOTER + EXPORT
// ============================================






{/* =====================================
INPUT AREA
===================================== */}



<div


className="

border-t

border-slate-800

bg-slate-950/50

p-4

flex

items-center

gap-3

"

>






<input


type="text"


value={inputText}



onChange={(e)=>


setInputText(

e.target.value

)

}



onKeyDown={(e)=>{


if(

e.key==="Enter"

&&

!loading

){


handleSendMessage();


}



}}




placeholder="Ask SHIVINFRA AI about projects, customers, leads, bills..."




className="

flex-1

bg-slate-900

border

border-slate-800

rounded-xl

px-4

py-3

text-sm

text-white

placeholder:text-slate-500

focus:outline-none

focus:border-sky-500

"





/>










<button


onClick={()=>


handleSendMessage()

}



disabled={loading}




className="

bg-sky-600

hover:bg-sky-700

disabled:opacity-50

text-white

p-3

rounded-xl

transition

flex

items-center

justify-center

"

>



<Send

size={18}

/>



</button>







</div>







</div>









</div>









{/* =====================================
AI FOOTER STATUS
===================================== */}



<div


className="

flex

justify-center

items-center

gap-2

text-[10px]

text-slate-500

"

>



<span>

Powered by SHIVINFRA AI Agent

</span>




<span>

•

</span>




<span>

Web + WhatsApp Automation Ready

</span>




</div>







</div>





);

};









// ============================================
// EXPORT
// ============================================


export {
    AIAssistant
};


export default AIAssistant;