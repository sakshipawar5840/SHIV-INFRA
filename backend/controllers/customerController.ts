import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import customerService from "../services/customerService.ts";



export class CustomerController {





// =====================================================
// GET ALL CUSTOMERS
// =====================================================


static async getCustomers(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
){

try{


    const companyId =
    req.user?.company_id;



    const customers =
    await customerService.getCustomers(
        companyId
    );



    return res.json({

        success:true,

        count:customers.length,

        data:customers

    });



}
catch(error){

    next(error);

}


}









// =====================================================
// GET CUSTOMER BY ID
// =====================================================


static async getCustomerById(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
){


try{


    const companyId =
    req.user?.company_id;



    const customer =
    await customerService.getCustomerById(

        req.params.id,

        companyId

    );





    if(!customer){

        return res.status(404).json({

            success:false,

            message:
            "Customer not found"

        });

    }




    return res.json({

        success:true,

        data:customer

    });



}
catch(error){

    next(error);

}



}









// =====================================================
// CREATE CUSTOMER
// =====================================================


static async createCustomer(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
){


try{


    const companyId =
    req.user?.company_id;




    if(!companyId){

        return res.status(401).json({

            success:false,

            message:
            "Company authentication missing"

        });

    }






    const customerData = {


        company_id:
        companyId,


        full_name:
        req.body.full_name
        ||
        req.body.name
        ||
        req.body.customer_name
        ||
        "",


        phone:
        req.body.phone || "",


        email:
        req.body.email || null,


        city:
        req.body.city || null,


        state:
        req.body.state || null,


        pincode:
        req.body.pincode || null,


        address:
        req.body.address || null,


        budget:
        req.body.budget || null,


        interested_location:
        req.body.interested_location
        ||
        req.body.location_preference
        ||
        null,


        interested_property_type:
        req.body.interested_property_type
        ||
        req.body.requirement
        ||
        null,


        source:
        req.body.source
        ||
        req.body.lead_source
        ||
        null,


        status:
        req.body.status || "active",


        notes:
        req.body.notes || null


    };







    const customer =
    await customerService.createCustomer(

        customerData

    );





    if(customer?.duplicate){

    return res.status(409).json({

        success:false,

        message:
        customer.message,

        data:
        customer.data

    });

}



return res.status(201).json({

    success:true,

    message:
    "Customer created successfully",

    data:customer.data

});



}
catch(error){

    next(error);

}


}









// =====================================================
// UPDATE CUSTOMER
// =====================================================


static async updateCustomer(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
){


try{


    const companyId =
    req.user?.company_id;




    const updated =
    await customerService.updateCustomer(


        req.params.id,


        companyId,


        {


            ...req.body


        }



    );







    return res.json({

        success:true,

        message:
        "Customer updated successfully",

        data:updated.data

    });



}
catch(error){

    next(error);

}


}









// =====================================================
// AI UPDATE CUSTOMER
// =====================================================


static async aiUpdateCustomer(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
){


try{


    const companyId =
    req.user?.company_id;



    const result =
    await customerService.aiUpdateCustomer(

        companyId,

        req.body

    );




    return res.json({

        success:true,

        data:result.data

    });



}
catch(error){

    next(error);

}


}









// =====================================================
// DELETE CUSTOMER SOFT DELETE
// =====================================================


static async deleteCustomer(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
){


try{


    const companyId =
    req.user?.company_id;



    const result =
    await customerService.deleteCustomer(


        req.params.id,


        companyId,


        {}


    );






    return res.json({

        success:true,

        message:
        "Customer moved to recycle bin",

        data:result.data

    });



}
catch(error){

    next(error);

}


}









// =====================================================
// AI DELETE CUSTOMER
// =====================================================


static async aiDeleteCustomer(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
){


try{


    const companyId =
    req.user?.company_id;



    const result =
    await customerService.aiDeleteCustomer(

        companyId,

        req.body

    );






    return res.json({

        success:true,

        data:result.data

    });



}
catch(error){

    next(error);

}


}









// =====================================================
// RESTORE CUSTOMER
// =====================================================


static async restoreCustomer(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
){


try{


    const companyId =
    req.user?.company_id;



    const result =
    await customerService.restoreCustomer(

        req.params.id,

        companyId

    );





    return res.json({

        success:true,

        data:result.data

    });



}
catch(error){

    next(error);

}


}



}







export default CustomerController;