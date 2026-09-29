import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { vendorService } from "../services/vendorService.ts";

export class VendorController {
  static async getVendors(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { q } = req.query;
      const result = await vendorService.list(companyId, q ? String(q) : undefined);
      return res.json({ success: true, count: result.count, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async getVendorById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const vendor = await vendorService.getById(id, companyId);
      if (!vendor) {
        return res.status(404).json({ success: false, message: "Vendor not found" });
      }
      return res.json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  }

  static async createVendor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const result = await vendorService.create(companyId, req.body);
      return res.status(201).json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async updateVendor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const result = await vendorService.update(id, companyId, req.body);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteVendor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const result = await vendorService.delete(id, companyId);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }
}

export default VendorController;
