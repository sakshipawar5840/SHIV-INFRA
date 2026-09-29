import { Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { supabaseAdmin as supabase } from "../config/supabase.ts";
import { OCRService } from "../services/ocrService.ts";
import { GoogleService } from "../services/googleService.ts";


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


        material_name:
          req.body.material_name ||
          req.body.material ||
          "",


        quantity:
          req.body.quantity || null,


        unit:
          req.body.unit || "",


        amount:
          Number(req.body.amount) || 0,


        gst_amount:
          Number(req.body.gst_amount || req.body.gst_number || 0) || 0,


        bill_number:
          req.body.bill_number ||
          req.body.invoice_number ||
          "",


        bill_date:
          req.body.bill_date ||
          new Date()
          .toISOString()
          .split("T")[0],


        payment_status:
          req.body.payment_status || "Pending",


        bill_file_url: null,


        ocr_text:
          req.body.ocr_text || "",


        remarks:
          req.body.remarks || ""

      };


      if (req.file) {


        const localPath =
          req.file.path ||
          path.join(
            process.cwd(),
            "uploads",
            req.file.filename
          );


        const storagePath =
          `${companyId}/${Date.now()}-${req.file.filename}`;


        const { error: uploadError } =
          await supabase.storage
            .from("bills")
            .upload(
              storagePath,
              fs.createReadStream(localPath),
              {
                contentType:
                  req.file.mimetype,
                upsert: true,
              }
            );


        if (uploadError) {
          console.error(
            "[BILL UPLOAD] Supabase Storage upload failed:",
            uploadError
          );
        } else {
          const { data } =
            supabase.storage
              .from("bills")
              .getPublicUrl(storagePath);


          billData.bill_file_url =
            data.publicUrl;
        }

      }



      const {data,error}=

        await supabase
        .from("bills")
        .insert(billData)
        .select()
        .single();



      if(error) throw error;

      const billId = (data as any)?.id;
      let responseData: any = data;

      if (billId && req.file?.path) {
        try {
          const ocrResult = await OCRService.extractInvoiceData(req.file.path);

          const ocrPayload = {
            ocr_status: ocrResult.ocr_status,
            vendor: ocrResult.vendor,
            gst_number: ocrResult.gst_number,
            invoice_number: ocrResult.invoice_number,
            amount: ocrResult.amount,
            bill_date: ocrResult.bill_date,
            material: ocrResult.material,
            text: ocrResult.text
          };

          const updateObj: any = {
            ocr_text: ocrPayload,
            updated_at: new Date().toISOString()
          };

          if (ocrResult.ocr_status === "Success") {
            updateObj.vendor_name = ocrResult.vendor;
            updateObj.material_name = ocrResult.material;
            updateObj.amount = ocrResult.amount;
            if (ocrResult.bill_date) {
              updateObj.bill_date = ocrResult.bill_date;
            }
          }

          const { error: ocrUpdateError } = await supabase
            .from("bills")
            .update(updateObj)
            .eq("id", billId)
            .eq("company_id", companyId);

          if (ocrUpdateError) {
            console.error("[BILL OCR] OCR update failed:", ocrUpdateError);
          } else {
            const { data: updatedData } = await supabase
              .from("bills")
              .select("*")
              .eq("id", billId)
              .eq("company_id", companyId)
              .single();
            if (updatedData) responseData = updatedData;
          }

          if (req.file?.path && fs.existsSync(req.file.path)) {

              let siteName = "";

              if (billData.project_id) {

                  const { data: project } = await supabase

                      .from("projects")

                      .select("project_name")

                      .eq("id", billData.project_id)

                      .maybeSingle();

                  siteName = project?.project_name || "";

              }

              if (siteName) {

                  try {

                      await GoogleService.uploadToDrive(

                          req.file.path,

                          req.file.originalname,

                          req.file.mimetype,

                          `Projects/${siteName}/Bills`

                      );

                  } catch (driveErr) {

                      console.error("[SHIVINFRA BILL] Drive upload failed:", driveErr);

                  }

              }

          }
        } catch (ocrErr) {
          console.error("[BILL OCR] OCR processing threw:", ocrErr);
        } finally {
          try {
            if (req.file?.path && fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
          } catch (unlinkErr) {
            console.error("[BILL OCR] Failed to delete temp file:", unlinkErr);
          }
        }
      }


      return res.status(201).json({

        success:true,

        message:"Bill created successfully",

        data: responseData

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


      const allowedFields = [
        "vendor_name",
        "material_name",
        "quantity",
        "unit",
        "amount",
        "gst_amount",
        "bill_number",
        "bill_date",
        "payment_status",
        "ocr_text",
        "remarks"
      ];

      const updateData: any = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const {
        data,
        error
      } = await supabase
        .from("bills")
        .update({

          ...updateData,

          updated_at: new Date().toISOString()

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