// SHIVINFRA AI ASSISTANT
// PRODUCTION FRONTEND AI AGENT


import React, {
    useState,
    useRef,
    useEffect
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
    import.meta.env.PROD
      ? "/api/v1"
      : "http://localhost:3000/api/v1";







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


const [aiStatus,setAiStatus] = useState<{status:string,provider:string,message:string}>({
    status:"checking",
    provider:"unknown",
    message:"Checking AI status"
});


useEffect(()=>{
    const token = localStorage.getItem("token");
    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/ai/gemini-status`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data && data.status) {
                setAiStatus({
                    status: data.status,
                    provider: data.provider || "unknown",
                    message: data.message || ""
                });
            }
        } catch {
            setAiStatus({ status: "fallback", provider: "rule-based", message: "Using rule-based fallback" });
        }
    };
    fetchStatus();
}, []);
const [customerCount, setCustomerCount] = useState<number | null>(
    null
);

useEffect(() => {
    const token = getAuthToken();
    const fetchCustomerCount = async () => {
        try {
            const res = await fetch(`${API_URL}/customers`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data && typeof data.count === "number") {
                setCustomerCount(
                    data.count
                );
            }
        } catch {
            setCustomerCount(
                null
            );
        }
    };
    fetchCustomerCount();
}, []);

const messagesEndRef = useRef<HTMLDivElement>(null);

const scrollToBottom = () => {
    messagesEndRef.current?.scrollTo({
        top: messagesEndRef.current.scrollHeight,
        behavior: "smooth"
    });
};

useEffect(() => {
    scrollToBottom();
}, [messages]);

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

const handleClearConversation = () => {
    setMessages([
        {
            id:"welcome",
            sender:"ai",
            text:
            "Hello 👋 I am SHIVINFRA AI Agent. I can manage Projects, Customers, Leads, Bills, Expenses, Reports and WhatsApp automation.",
            timestamp:"Now",
            success:true
        }
    ]);
    setError("");
    setInputText("");
};

const quickCommands = [

    {
        title: "Search Projects",
        message: "Show available projects in Pune"
    },

    {
        title: "Add Project",
        message: "Add new project with details"
    },

    {
        title: "Update Project",
        message: "Update project details"
    },

    {
        title: "Delete Project",
        message: "Delete a project"
    },

    {
        title: "Search Customers",
        message: "Show customers list"
    },

    {
        title: "Add Customer",
        message: "Add new customer"
    },

    {
        title: "Today's Leads",
        message: "Show today's leads"
    },

    {
        title: "Add Lead",
        message: "Add new lead"
    },

    {
        title: "Search Leads",
        message: "Search leads by criteria"
    },

    {
        title: "Add Expense",
        message: "Add new expense"
    },

    {
        title: "Check Expenses",
        message: "Show current expenses"
    },

    {
        title: "Search Expenses",
        message: "Search expenses by criteria"
    },

    {
        title: "Add Task",
        message: "Create new task"
    },

    {
        title: "Search Tasks",
        message: "Show tasks list"
    },

    {
        title: "Add Site Visit",
        message: "Book new site visit"
    },

    {
        title: "Search Site Visits",
        message: "Show site visits list"
    },

    {
        title: "Add Vendor",
        message: "Add new vendor"
    },

    {
        title: "Search Vendors",
        message: "Show vendors list"
    },

    {
        title: "Add Inventory",
        message: "Add new inventory item"
    },

    {
        title: "Search Inventory",
        message: "Show inventory items"
    },

    {
        title: "Material Search",
        message: "Search material suppliers near Pune"
    },

    {
        title: "Search Bills",
        message: "Show bills list"
    },

    {
        title: "Search Documents",
        message: "Show documents list"
    },

    {
        title: "Create Broadcast",
        message: "Create WhatsApp broadcast campaign"
    },

    {
        title: "Generate Report",
        message: "Generate monthly business report"
    },

    {
        title: "Check Expenses",
        message: "Show current expenses"
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

text-text-primary

font-sans

"

>





{/* =====================================
AI HEADER
===================================== */}




<div


className="

bg-surface

border

border-border

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

bg-ai/10

border

border-ai/30

flex

items-center

justify-center

"

>



<Brain

size={26}


className="text-ai animate-pulse"

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

text-text-secondary

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

bg-success/5

border

border-emerald-500/20

text-success

text-xs

"

>


<Circle

size={8}


className="fill-emerald-400"

/>


{aiStatus.status === "available" ? "AI Online" : aiStatus.status === "degraded" ? "AI Degraded" : aiStatus.status === "fallback" ? "AI Fallback" : "AI Checking"}



</span>








<span

className="

px-3

py-1

rounded-full

bg-ai/10

border

border-ai/20

text-ai

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

bg-primary/5

border

border-primary/20

text-primary

text-xs

"

>

{aiStatus.provider === "gemini" ? "Gemini Engine" : aiStatus.provider === "openai" ? "OpenAI Engine" : aiStatus.provider === "rule-based" ? "Rule Engine" : "AI Engine"}


</span>


{customerCount !== null && (
<span
className="
flex
items-center
gap-1
px-3
py-1
rounded-full
bg-primary/5
border
border-primary/20
text-primary
text-xs
"
>
<span
className="
font-bold
text-primary
"
>
{customerCount}
</span>
Customers
</span>
)
}


<button
onClick={handleClearConversation}
className="
ml-3
px-3
py-1
rounded-lg
bg-surface
border
border-border
text-xs
text-text-secondary
hover:bg-red-500/10
hover:border-red-500/30
hover:text-red-400
transition
"
>
Clear
</button>

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

bg-surface

border

border-border

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

text-text-secondary

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

bg-surface

border

border-border

hover:border-ai

transition

text-xs

text-text-secondary

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


className="text-ai"

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

bg-black/5

border

border-black/10

text-black

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

bg-surface

border

border-border

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

bg-surface/30

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

bg-ai/10

border

border-ai/20

flex

items-center

justify-center

shrink-0

"

>


<Bot

size={18}


className="text-ai"

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


"bg-surface border border-border text-text-primary"


:


"bg-primary text-white"



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

text-ai

font-mono

border-t

border-border

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

bg-surface

border

border-border

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
<div ref={messagesEndRef} />










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

bg-ai/10

border

border-ai/20

flex

items-center

justify-center

animate-pulse

"

>


<Bot

size={18}


className="text-ai"

/>


</div>







<div


className="

bg-surface

border

border-border

px-4

py-3

rounded-xl

text-xs

text-text-secondary

"

>



SHIVINFRA AI is thinking...




</div>







</div>


)

}







</div>











{/* =====================================
INPUT AREA
===================================== */}




<div


className="

border-t

border-border

bg-surface/50

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

bg-surface

border

border-border

rounded-xl

px-4

py-3

text-sm

text-white

placeholder:text-text-secondary

focus:outline-none

focus:border-ai

"





/>










<button


onClick={()=>


handleSendMessage()

}




disabled={loading}





className="

bg-ai

hover:bg-ai-hover

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

text-text-secondary

"

>



<span>

Powered by SHIVINFRA AI Agent

</span>




<span>

•

</span>




<span>

Configuration-dependent external services

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