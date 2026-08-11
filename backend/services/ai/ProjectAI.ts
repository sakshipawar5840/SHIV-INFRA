// =====================================================
// SHIVINFRA PROJECT AI V15
// PROJECT CRUD ACTION ENGINE
// PRODUCTION MODULE
//
// ADD PROJECT
// SEARCH PROJECTS
// UPDATE PROJECT
// DELETE PROJECT
// =====================================================


import { supabaseAdmin as supabase } 
from "../../config/supabase.ts";




// =====================================================
// TYPES
// =====================================================


interface AIUserContext {


    id:string | null;


    company_id:string;


    role:
    |
    "ADMIN"
    |
    "ENGINEER"
    |
    "CUSTOMER";



    channel:
    |
    "WEB"
    |
    "WHATSAPP";



}




interface AIResult {


    success:boolean;


    message:string;


    data?:any;


    code?:string;


}









// =====================================================
// PROJECT AI SERVICE
// =====================================================


class ProjectAI {






// =====================================================
// MAIN ROUTER
// =====================================================


static async execute(

intent:string,

parameters:any,

user:AIUserContext


):Promise<AIResult>{


try{


switch(intent){



case "ADD_PROJECT":


return await this.addProject(

parameters,

user

);



case "SEARCH_PROJECTS":


return await this.searchProjects(

parameters,

user

);



case "UPDATE_PROJECT":


return await this.updateProject(

parameters,

user

);



case "DELETE_PROJECT":


return await this.deleteProject(

parameters,

user

);



default:


return {


success:false,


message:

"Invalid project action",


code:

"INVALID_ACTION"



};



}



}

catch(error:any){


console.error(

"PROJECT AI EXECUTE ERROR",

error.message

);



return {


success:false,


message:

"Project operation failed",


code:

"PROJECT_ERROR"



};



}



}









// =====================================================
// ADD PROJECT
// =====================================================


private static async addProject(


params:any,


user:AIUserContext


):Promise<AIResult>{



try{



if(!params.project_name){



return {


success:false,


message:

"Project name is required"



};



}







const payload={



company_id:

user.company_id,



project_name:

params.project_name,



project_type:

params.project_type || "Residential",



location:

params.location || "",



city:

params.city || "",



state:

params.state || "",



pincode:

params.pincode || "",



description:

params.description || "",



price:

Number(params.price) || 0,



flat_type:

params.flat_type || "",



total_units:

params.total_units || 0,



available_units:

params.available_units || 0,



status:

params.status || "Active"





};








const {

data,

error

}=


await supabase

.from("projects")

.insert(payload)

.select()

.single();







if(error)

throw error;









return {


success:true,


message:

"Project created successfully",


data



};





}

catch(error:any){



return {


success:false,


message:

error.message || 

"Project creation failed"



};



}



}









// =====================================================
// SEARCH PROJECTS
// =====================================================


private static async searchProjects(


params:any,


user:AIUserContext


):Promise<AIResult>{



try{



let query =

supabase

.from("projects")

.select("*")

.eq(

"company_id",

user.company_id

);









if(params.city){



query=query.ilike(

"city",

`%${params.city}%`

);



}







if(params.status){



query=query.eq(

"status",

params.status

);



}







if(params.query){



query=query.or(

`project_name.ilike.%${params.query}%,location.ilike.%${params.query}%,city.ilike.%${params.query}%`

);



}







const {

data,

error

}=

await query;







if(error)

throw error;









return {


success:true,


message:


`${data?.length || 0} projects found`,


data:data || []



};





}

catch(error:any){



return {


success:false,


message:

error.message || 

"Project search failed"



};



}



}









// =====================================================
// UPDATE PROJECT
// =====================================================


private static async updateProject(


params:any,


user:AIUserContext


):Promise<AIResult>{



try{



if(!params.project_name){



return {


success:false,


message:

"Project name required"



};



}







const updateData:any={};







if(params.city)

updateData.city=params.city;





if(params.location)

updateData.location=params.location;





if(params.price)

updateData.price=

Number(params.price);





if(params.status)

updateData.status=params.status;





if(params.description)

updateData.description=params.description;









const {

data,

error

}=



await supabase

.from("projects")

.update(updateData)

.eq(

"company_id",

user.company_id

)

.ilike(

"project_name",

`%${params.project_name}%`

)

.select();









if(error)

throw error;








return {


success:true,


message:

"Project updated successfully",


data



};





}

catch(error:any){



return {


success:false,


message:

error.message || 

"Project update failed"



};



}



}









// =====================================================
// DELETE PROJECT
// =====================================================


private static async deleteProject(


params:any,


user:AIUserContext


):Promise<AIResult>{



try{



if(!params.project_name){



return {


success:false,


message:

"Project name required"



};



}







const {

data,

error

}=



await supabase

.from("projects")

.delete()

.eq(

"company_id",

user.company_id

)

.ilike(

"project_name",

`%${params.project_name}%`

)

.select();









if(error)

throw error;









return {


success:true,


message:

"Project deleted successfully",


data



};





}

catch(error:any){



return {


success:false,


message:

error.message || 

"Project delete failed"



};



}



}







// =====================================================
// HEALTH
// =====================================================


static health(){


return {


module:

"ProjectAI",


status:

"RUNNING"



};



}





}







export default ProjectAI;


// =====================================================
// END PROJECT AI V15
// =====================================================