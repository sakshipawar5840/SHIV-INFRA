// ============================================
// SHIVINFRA AI
// AGENT CONTROLLER
// Main AI Agent Entry Point
// ============================================


import { Request, Response } from "express";


import agentRouter from "../services/agents/agentRouter";

import adminAgent from "../services/agents/adminAgent";

import customerAgent from "../services/agents/customerAgent";

import engineerAgent from "../services/agents/engineerAgent";





class AgentController {





// ============================================
// HANDLE AI AGENT REQUEST
// ============================================


public async handleAgent(

req:Request,

res:Response

){



try{



const {


message,

intent,

parameters,

sessionId


}=req.body;






const user =

(req as any).user || {

role:"customer"

};









// Route user


const route =

await agentRouter.route({

user,

message,

intent,

sessionId



});








let result;






switch(route.role){



case "admin":



result =

await adminAgent.execute({

user,

intent,

parameters,

message

});



break;







case "engineer":



result =

await engineerAgent.execute({

user,

intent,

parameters,

message

});



break;







case "customer":



default:



result =

await customerAgent.execute({

user,

intent,

parameters,

message

});



break;



}








return res.json({

success:true,


agent:

route.role,


result



});







}

catch(error:any){



console.error(

"AGENT CONTROLLER ERROR",

error

);





return res.status(500).json({



success:false,


message:

"AI Agent processing failed",


error:

error.message



});



}



}








}





export default new AgentController();
