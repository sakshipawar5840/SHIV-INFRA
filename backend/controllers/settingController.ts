import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { settingService } from "../services/settingService.ts";

export class SettingController {
  static async getSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const result = await settingService.getByCompany(companyId);
      return res.json({ success: true, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const result = await settingService.update(companyId, req.body);
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }
}

export default SettingController;
