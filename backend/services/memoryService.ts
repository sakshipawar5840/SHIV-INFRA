// ============================================
// SHIVINFRA AI MEMORY SERVICE V3
// Conversation Context Memory
// Production Version
// ============================================


import { supabaseAdmin as supabase } from "../config/supabase.ts";



class MemoryService {



    // ========================================
    // SAVE MEMORY
    // ========================================


    async saveMemory(data:any){


        try{


            const {

                company_id,

                user_id,

                session_id,

                message,

                intent,

                parameters,

                response

            } = data;




            console.log(
                "[MEMORY INSERT]",
                {
                    company_id,
                    user_id,
                    intent
                }
            );





            if(!company_id){


                console.log(
                    "MEMORY SKIPPED: company missing"
                );


                return null;


            }






            const insertData:any = {


                company_id,


                user_id: user_id || null,


                session_id:
                session_id || "default",



                message:
                message || "",



                intent:
                intent || "GENERAL_CHAT",



                parameters:
                parameters || {},



                response:

                typeof response === "object"

                ?

                JSON.stringify(response)

                :

                response || ""



            };






            const {

                data:result,

                error


            } = await supabase


            .from("ai_memory")


            .insert(insertData)


            .select()


            .single();








            if(error){


                console.log(
                    "[MEMORY SUPABASE ERROR]",
                    error
                );


                throw error;


            }






            console.log(

                "[MEMORY SAVED]",

                result.id

            );



            return result;



        }

        catch(error:any){



            console.log(

                "[MEMORY SAVE ERROR]",

                error.message

            );



            return null;


        }



    }








    // ========================================
    // GET RECENT MEMORY
    // ========================================


    async getMemory(

        company_id:string,

        user_id?:string

    ){


        try{



            let query = supabase

            .from("ai_memory")

            .select("*")

            .eq(

                "company_id",

                company_id

            )

            .order(

                "created_at",

                {

                    ascending:false

                }

            )

            .limit(10);






            if(user_id){


                query = query.eq(

                    "user_id",

                    user_id

                );


            }





            const {

                data,

                error


            } = await query;





            if(error)

                throw error;





            return data || [];



        }

        catch(error:any){


            console.log(

                "[MEMORY FETCH ERROR]",

                error.message

            );


            return [];


        }



    }








    // ========================================
    // LAST INTENT
    // ========================================


    async getLastIntent(

        company_id:string,

        user_id?:string

    ){



        const memory =

        await this.getMemory(

            company_id,

            user_id

        );




        if(!memory.length)

            return null;



        return memory[0];



    }



}




export default new MemoryService();