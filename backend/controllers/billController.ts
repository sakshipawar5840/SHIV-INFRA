import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { supabaseAdmin as supabase } from "../config/supabase.ts";


export class BillController {


  // ===============================
  // GET ALL BILLS
  // ===============================

  static async getBills(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ){

    const companyId = req.user!.company_id;


    try{

      const {data,error} =
        await supabase
        .from("bills")
        .select("*")
        .eq("company_id",companyId);


      if(error) throw error;


      return res.json({

        success:true,

        count:data.length,

        data

      });


    }catch(err){

      next(err);

    }

  }





  // ===============================
  // CREATE BILL
  // ===============================

  static async uploadBill(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
  ){

    const companyId = req.user!.company_id;


    try{


      const billData = {


        company_id:companyId,


        project_id:
          req.body.project_id || null,


        uploaded_by:
          req.user?.id,


        vendor_name:
          req.body.vendor_name || "",


        material:
          req.body.material || "",


        quantity:
          req.body.quantity || null,


        unit:
          req.body.unit || "",


        amount:
          Number(req.body.amount),


        gst_number:
          req.body.gst_number || null,


        invoice_number:
          req.body.invoice_number || "",


        bill_date:
          req.body.bill_date ||
          new Date()
          .toISOString()
          .split("T")[0],


        ocr_status:
          req.body.ocr_status || "Pending",


        bill_file_url:
          req.file
          ? `/uploads/${req.file.filename}`
          : null,


        ocr_text:
          req.body.ocr_text || "",


        remarks:
          req.body.remarks || ""

      };



      const {data,error}=

        await supabase
        .from("bills")
        .insert(billData)
        .select()
        .single();



      if(error) throw error;



      return res.status(201).json({

        success:true,

        message:"Bill created successfully",

        data

      });



    }catch(err){

      next(err);

    }


  }

// ===============================
// GET SINGLE BILL
// ===============================

static async getBillById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
){

  const companyId = req.user!.company_id;

  const { id } = req.params;


  try{

    const {
      data,
      error
    } = await supabase
      .from("bills")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();



    if(error || !data){

      return res.status(404).json({

        success:false,

        message:"Bill not found"

      });

    }



    return res.json({

      success:true,

      data

    });



  }catch(err){

    next(err);

  }

}


// ===============================
// UPDATE BILL
// ===============================

static async updateBill(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
){

  const companyId = req.user!.company_id;


  const { id } = req.params;


  try{


    const {
      data,
      error
    } = await supabase
      .from("bills")
      .update({

        ...req.body,

        updated_at:new Date().toISOString()

      })
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();



    if(error){

      throw error;

    }



    return res.json({

      success:true,

      message:"Bill updated successfully",

      data

    });



  }catch(err){

    next(err);

  }

}

  // ===============================
  // DELETE BILL
  // ===============================

  static async deleteBill(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
  ){


    const companyId = req.user!.company_id;


    const {id}=req.params;



    try{


      const {error}=

        await supabase
        .from("bills")
        .delete()
        .eq("id",id)
        .eq("company_id",companyId);



      if(error) throw error;



      return res.json({

        success:true,

        message:"Bill deleted successfully"

      });



    }catch(err){

      next(err);

    }


  }


}


export default BillController;