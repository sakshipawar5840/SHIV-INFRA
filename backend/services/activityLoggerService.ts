// ============================================
// SHIVINFRA ACTIVITY LOGGER SERVICE
// PRODUCTION LOG SERVICE
// ============================================

import { supabaseAdmin as supabase } from "../config/supabase.ts";


class ActivityLoggerService {

    async log(data:any){

        try{

            const companyId =
                data?.company_id;

            if (!companyId) {

                return {

                    success:true

                };

            }

            const userId =
                data?.user_id || null;

            const userEmail =
                data?.user_email ||
                data?.email ||
                null;

            const actionType =
                data?.action_type ||
                data?.action ||
                "SYSTEM";

            const details =
                data?.details ||
                data?.message ||
                data?.intent ||
                null;

            const ipAddress =
                data?.ip_address ||
                null;

            const { error } = await supabase
                .from("activity_logs")
                .insert([{

                    company_id: companyId,

                    user_id: userId,

                    user_email: userEmail,

                    action_type: actionType,

                    details: details,

                    ip_address: ipAddress

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
