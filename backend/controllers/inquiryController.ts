import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { inquiryService } from "../services/inquiryService.ts";

export class InquiryController {
  static async getInquiries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { q } = req.query;
      const result = await inquiryService.list(companyId, q ? String(q) : undefined);
      return res.json({ success: true, count: result.count, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async getInquiryById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const inquiry = await inquiryService.getById(id, companyId);
      if (!inquiry) {
        return res.status(404).json({ success: false, message: "Inquiry not found" });
      }
      return res.json({ success: true, data: inquiry });
    } catch (err) {
      next(err);
    }
  }

  static async createInquiry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const result = await inquiryService.create(companyId, req.body);
      return res.status(201).json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async updateInquiry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const result = await inquiryService.update(id, companyId, req.body);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteInquiry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const result = await inquiryService.delete(id, companyId);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }
}

export default InquiryController;
