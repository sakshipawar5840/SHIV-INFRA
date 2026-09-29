import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { ProjectService } from "../services/projectService.ts";

const projectService = new ProjectService();

export class ProjectController {

  static async getProjects(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const companyId = req.user!.company_id;
      const { query, status, city } = req.query;

const result = await projectService.searchProjects(
        companyId,
        String(query || ""),
        {
          city: city ? String(city) : undefined,
          status: status ? String(status) : undefined,
        }
      );

      return res.json({
        success: true,
        count: result.count || 0,
        data: result.data || [],
      });
    } catch (err) {
      next(err);
    }
  }

  static async getProjectById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;

      const project = await projectService.getProjectById(
        id,
        companyId
      );

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      return res.json({
        success: true,
        data: project,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createProject(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const companyId = req.user!.company_id;

      const body = req.body;

      const projectData: any = {
        company_id: companyId,
        project_name:
          body.project_name ||
          body.name ||
          "",
        location: body.location || "",
        city: body.city || null,
        flat_type: body.flat_type || null,
        sqft: body.sqft || null,
        price: body.price != null ? Number(body.price) : null,
        status: body.status || "Ongoing",
        description: body.description || null,
        brochure_pdf_url:
          body.brochure_pdf_url ||
          body.brochure_url ||
          null,
        amenities: body.amenities || null,
        google_maps_url: body.google_maps_url || null,
        progress:
          body.progress != null
            ? Number(body.progress)
            : null,
        completion_status:
          body.completion_status || null,
        possession_date:
          body.possession_date || null,
      };

      if (req.file) {
        projectData.brochure_pdf_url =
          `/uploads/${req.file.filename}`;
      }

      const result = await projectService.createProject(
        projectData
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          data: result.data,
        });
      }

      return res.status(201).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateProject(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;

      const body = req.body;

      const updatePayload: any = {
        updated_at: new Date().toISOString(),
      };

      if (body.project_name !== undefined || body.name !== undefined) {
        updatePayload.project_name = body.project_name || body.name;
      }
      if (body.location !== undefined) updatePayload.location = body.location;
      if (body.city !== undefined) updatePayload.city = body.city;
      if (body.flat_type !== undefined) updatePayload.flat_type = body.flat_type;
      if (body.sqft !== undefined) updatePayload.sqft = body.sqft;
      if (body.price !== undefined) updatePayload.price = Number(body.price);
      if (body.status !== undefined) updatePayload.status = body.status;
      if (body.description !== undefined) updatePayload.description = body.description;
      if (body.brochure_pdf_url !== undefined) updatePayload.brochure_pdf_url = body.brochure_pdf_url;
      if (body.brochure_url !== undefined) updatePayload.brochure_pdf_url = body.brochure_url;
      if (body.amenities !== undefined) updatePayload.amenities = body.amenities;
      if (body.google_maps_url !== undefined) updatePayload.google_maps_url = body.google_maps_url;
      if (body.progress !== undefined) updatePayload.progress = Number(body.progress);
      if (body.completion_status !== undefined) updatePayload.completion_status = body.completion_status;
      if (body.possession_date !== undefined) updatePayload.possession_date = body.possession_date;

      if (req.file) {
        updatePayload.brochure_pdf_url =
          `/uploads/${req.file.filename}`;
      }

      const result = await projectService.updateProject(
        id,
        companyId,
        updatePayload,
        true
      );

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message || "Project not found",
        });
      }

      return res.json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteProject(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;

      const result = await projectService.deleteProject(
        id,
        companyId
      );

      return res.json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default ProjectController;
