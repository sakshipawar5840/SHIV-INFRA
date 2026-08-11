import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "../config/supabase.ts";
import { mockProjects, Project } from "../database/mockDB.ts";


export class ProjectController {


  // ===============================
  // GET ALL PROJECTS
  // ===============================

  static async getProjects(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ){

    const companyId = req.user!.company_id;


    const { query, status, city } = req.query;


    try{


      let projects: Project[] = [];


      if(isSupabaseConfigured){


        let dbQuery = supabase
          .from("projects")
          .select("*")
          .eq("company_id", companyId);



        if(status){

          dbQuery = dbQuery.eq(
            "status",
            status
          );

        }



        if(city){

          dbQuery = dbQuery.eq(
            "city",
            city
          );

        }



        if(query){

          dbQuery = dbQuery.ilike(
            "project_name",
            `%${query}%`
          );

        }



        const {
          data,
          error
        } = await dbQuery;



        if(error) throw error;


        projects = data || [];


      }else{


        projects =
          mockProjects.filter(
            p=>p.company_id === companyId
          );


      }



      return res.json({

        success:true,

        count:projects.length,

        data:projects

      });



    }catch(err){

      next(err);

    }

  }







  // ===============================
  // GET SINGLE PROJECT
  // ===============================

  static async getProjectById(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
  ){


    const companyId = req.user!.company_id;


    const {id}=req.params;



    try{


      const {
        data,
        error
      } =
      await supabase
        .from("projects")
        .select("*")
        .eq("id",id)
        .eq("company_id",companyId)
        .single();



      if(error || !data){

        return res.status(404).json({

          success:false,

          message:"Project not found"

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
  // CREATE PROJECT
  // ===============================

  static async createProject(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
  ){


    const companyId = req.user!.company_id;



    try{


      const projectData = {


        company_id:companyId,


        project_name:
          req.body.name
          ||
          req.body.project_name
          ||
          "",


        location:
          req.body.location,


        city:
          req.body.city,


        state:
          req.body.state || "",


        pincode:
          req.body.pincode || "",


        description:
          req.body.description || "",


        flat_types:
          req.body.flat_types
          ||
          req.body.flat_type
          ||
          null,


        total_units:
          req.body.total_units || null,


        available_units:
          req.body.available_units || null,


        area_sqft:
          req.body.area_sqft || null,


        price:
          req.body.price || null,


        brochure_url:
          req.body.brochure_url
          ||
          req.body.brochure_pdf_url
          ||
          "",


        thumbnail_url:
          req.body.thumbnail_url || "",


        gallery:
          req.body.gallery || null,


        amenities:
          req.body.amenities || null,


        contact_person:
          req.body.contact_person || "",


        contact_number:
          req.body.contact_number || "",


        status:
          req.body.status || "Ongoing"

      };




      const {
        data,
        error
      } =
      await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single();



      if(error) throw error;



      return res.status(201).json({

        success:true,

        message:"Project created successfully",

        data

      });



    }catch(err){

      next(err);

    }


  }









  // ===============================
  // UPDATE PROJECT
  // ===============================

  static async updateProject(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
  ){


    const companyId = req.user!.company_id;


    const {id}=req.params;



    try{


      const updatePayload: Record<string, any> = {


        updated_at:
          new Date().toISOString()


      };


      if(req.body.name !== undefined) updatePayload.name = req.body.name;
      if(req.body.location !== undefined) updatePayload.location = req.body.location;
      if(req.body.city !== undefined) updatePayload.city = req.body.city;
      if(req.body.description !== undefined) updatePayload.description = req.body.description;
      if(req.body.flat_type !== undefined) updatePayload.flat_type = req.body.flat_type;
      if(req.body.sqft !== undefined) updatePayload.sqft = req.body.sqft;
      if(req.body.price !== undefined) updatePayload.price = req.body.price;
      if(req.body.status !== undefined) updatePayload.status = req.body.status;
      if(req.body.brochure_pdf_url !== undefined) updatePayload.brochure_pdf_url = req.body.brochure_pdf_url;
      if(req.body.amenities !== undefined) updatePayload.amenities = req.body.amenities;
      if(req.body.google_maps_url !== undefined) updatePayload.google_maps_url = req.body.google_maps_url;
      if(req.body.progress !== undefined) updatePayload.progress = req.body.progress;
      if(req.body.completion_status !== undefined) updatePayload.completion_status = req.body.completion_status;
      if(req.body.possession_date !== undefined) updatePayload.possession_date = req.body.possession_date;



      const {
        data,
        error
      } =
      await supabase
        .from("projects")
        .update(updatePayload)
        .eq("id",id)
        .eq("company_id",companyId)
        .select();



      if(error) throw error;



      if(!data || data.length===0){

        return res.status(404).json({

          success:false,

          message:"Project not found"

        });

      }



      return res.json({

        success:true,

        message:"Project updated successfully",

        data:data[0]

      });



    }catch(err){

      next(err);

    }


  }









  // ===============================
  // DELETE PROJECT
  // ===============================

  static async deleteProject(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
  ){


    const companyId = req.user!.company_id;


    const {id}=req.params;



    try{


      const {
        error
      } =
      await supabase
        .from("projects")
        .delete()
        .eq("id",id)
        .eq("company_id",companyId);



      if(error) throw error;



      return res.json({

        success:true,

        message:"Project deleted"

      });



    }catch(err){

      next(err);

    }


  }



}


export default ProjectController;