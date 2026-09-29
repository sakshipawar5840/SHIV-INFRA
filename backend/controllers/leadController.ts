import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import leadService from "../services/leadService.ts";



export class LeadController {



  // ===============================
  // GET ALL LEADS
  // ===============================

  static async getLeads(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ){

    try{

      const companyId =
        req.user?.company_id!;


      const leads =
        await leadService.getLeads(
          companyId
        );


      return res.status(200).json({

        success:true,

        count:leads.length,

        data:leads

      });


    }catch(error){

      next(error);

    }

  }






  // ===============================
  // GET LEAD BY ID
  // ===============================

  static async getLeadById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ){
    try{
      const companyId =
        req.user?.company_id!;

      const lead =
        await leadService.getLeadById(
          req.params.id,
          companyId
        );

      if(!lead){
        return res.status(404).json({
          success:false,
          message:"Lead not found"
        });
      }

      return res.json({
        success:true,
        data:lead
      });
    }catch(error){
      next(error);
    }
  }

  // ===============================
  // CREATE LEAD
  // ===============================

  static async createLead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ){

    try{

      const companyId =
        req.user?.company_id!;
      const leadData = {

        company_id: companyId,

        customer_id:
          req.body.customer_id || null,

        project_id:
          req.body.project_id || null,

        lead_source:
          req.body.lead_source || req.body.source || "WhatsApp",

        requirement:
          req.body.requirement || "",

        budget:
          req.body.budget || null,

        preferred_location:
          req.body.preferred_location || req.body.location || "",

        status:
          req.body.status || "New",

        assigned_to:
          req.body.assigned_to || req.body.assigned_sales_id || req.user?.id || null,

        remarks:
          req.body.remarks || req.body.notes || ""

      };

      const lead =
        await leadService.createLead(
          leadData
        );



      return res.status(201).json({

        success:true,

        message:"Lead created successfully",

        data:lead

      });



    }catch(error){

      next(error);

    }

  }







  // ===============================
  // UPDATE LEAD
  // ===============================

  static async updateLead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ){

    try{


      const {id}=req.params;


      const companyId =
        req.user?.company_id!;



      const lead =
        await leadService.updateLead(
          id,
          companyId,
          {
            ...req.body
          }
        );



      return res.status(200).json({

        success:true,

        message:"Lead updated successfully",

        data:lead

      });



    }catch(error){

      next(error);

    }

  }







  // ===============================
  // DELETE LEAD
  // ===============================

  static async deleteLead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ){

    try{


      const {id}=req.params;


      const companyId =
        req.user?.company_id!;



      await leadService.deleteLead(
        id,
        companyId
      );



      return res.status(200).json({

        success:true,

        message:"Lead deleted successfully"

      });



    }catch(error){

      next(error);

    }

  }


}


export default LeadController;