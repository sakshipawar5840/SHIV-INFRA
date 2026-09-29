import { Response, NextFunction } from "express";
import fs from "fs";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { documentService, DocumentUpdateInput } from "../services/documentService.ts";
import { supabaseAdmin as supabase } from "../config/supabase.ts";

export class DocumentController {
  static async getDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { project_id } = req.query;
      const result = await documentService.list(
        companyId,
        project_id ? String(project_id) : undefined
      );
      return res.json({ success: true, count: result.count, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async getDocumentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const doc = await documentService.getById(id, companyId);
      if (!doc) {
        return res.status(404).json({ success: false, message: "Document not found" });
      }
      return res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  static async createDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const file = req.file;
      const body = req.body;

      if (!file) {
        return res.status(400).json({ success: false, message: "File is required" });
      }

      const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ success: false, message: "Unsupported file type" });
      }

      const maxSize = 15 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({ success: false, message: "File size exceeds 15MB limit" });
      }

      const storagePath = `${companyId}/${Date.now()}-${file.originalname}`;
      const buffer = fs.readFileSync(file.path);

      await supabase.storage.from("documents").upload(storagePath, buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

      fs.unlinkSync(file.path);

      const result = await documentService.create({
        company_id: companyId,
        project_id: body.project_id || undefined,
        uploaded_by: req.user!.id,
        document_name: file.originalname,
        document_type: file.mimetype,
        file_url: storagePath,
        file_size: file.size,
      });

      return res.status(201).json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async updateDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const body = req.body;

      const allowedFields: string[] = ["document_name", "document_type", "project_id"];
      const updatePayload: any = {};

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updatePayload[field] = body[field] === "" ? null : body[field];
        }
      }

      if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ success: false, message: "No valid fields provided for update" });
      }

      const result = await documentService.update(id, companyId, updatePayload);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const result = await documentService.delete(id, companyId);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async getSignedUrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { path } = req.params;
      const signedUrl = await documentService.getSignedUrl(path);
      return res.json({ success: true, data: { signedUrl } });
    } catch (err) {
      next(err);
    }
  }
}


