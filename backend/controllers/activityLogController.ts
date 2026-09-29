import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { activityLogService } from "../services/activityLogService.ts";

export class ActivityLogController {
  static async getLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { q, limit } = req.query;
      const result = await activityLogService.list(
        companyId,
        q ? String(q) : undefined,
        limit ? Number(limit) : 100
      );
      return res.json({ success: true, count: result.count, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async createLog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const body = req.body;
      const result = await activityLogService.create({
        company_id: companyId,
        user_id: req.user!.id,
        user_email: req.user!.email,
        action_type: body.action_type,
        details: body.details,
        ip_address: req.ip,
      });
      return res.status(201).json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }
}

export default ActivityLogController;
