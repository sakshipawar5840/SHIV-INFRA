// ============================================
// SHIVINFRA ACTIVITY LOGGER SERVICE
// PRODUCTION LOG SERVICE
// ============================================


import { supabaseAdmin as supabase } from "../config/supabase.ts";



class ActivityLoggerService {



    async log(data:any){


        try{


            const {
                error
            } = await supabase
            .from("activity_logs")
            .insert([{

                company_id:
                data.company_id,

                user_id:
                data.user_id || null

            }]);





            if(error){


                console.log(
                    "[ACTIVITY LOG ERROR]",
                    error.message
                );


            }





            return {


                success:true


            };



        }
        catch(error:any){


            console.log(
                "[ACTIVITY LOGGER FAILED]",
                error.message
            );


            return {


                success:false,


                message:error.message


            };


        }


    }




}



export default new ActivityLoggerService();