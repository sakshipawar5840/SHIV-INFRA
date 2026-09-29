import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notificationService.ts";

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req as any).user?.company_id;
      const userId = (req as any).user?.id;
      if (!companyId) {
        return res.status(401).json({ success: false, error: "Unauthenticated" });
      }
      const list = await NotificationService.getAllNotifications(companyId, userId);
      return res.status(200).json({
        success: true,
        data: list,
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      const companyId = (req as any).user?.company_id;
      const userId = (req as any).user?.id;
      if (!companyId) {
        return res.status(401).json({ success: false, error: "Unauthenticated" });
      }
      const ok = await NotificationService.markAsRead(id, companyId, userId);
      return res.status(200).json({
        success: ok,
        message: ok ? "Marked as read." : "Notification not found.",
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req as any).user?.company_id;
      const userId = (req as any).user?.id;
      if (!companyId) {
        return res.status(401).json({ success: false, error: "Unauthenticated" });
      }
      await NotificationService.markAllAsRead(companyId, userId);
      return res.status(200).json({
        success: true,
        message: "All notifications marked as read.",
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteNotification(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      const companyId = (req as any).user?.company_id;
      const userId = (req as any).user?.id;
      if (!companyId) {
        return res.status(401).json({ success: false, error: "Unauthenticated" });
      }
      const ok = await NotificationService.deleteNotification(id, companyId, userId);
      return res.status(200).json({
        success: ok,
        message: ok ? "Notification deleted." : "Notification not found.",
      });
    } catch (err) {
      next(err);
    }
  }

  static async triggerAction(req: Request, res: Response, next: NextFunction) {
    const { type, customerData } = req.body;
    if (!type || !customerData) {
      return res.status(400).json({
        success: false,
        error: "Both 'type' and 'customerData' parameters are required.",
      });
    }

    try {
      const companyId = (req as any).user?.company_id;
      const userId = (req as any).user?.id;
      if (!companyId) {
        return res.status(401).json({ success: false, error: "Unauthenticated" });
      }
      const result = await NotificationService.triggerCustomerActionNotification(type, customerData, companyId, userId);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
export default NotificationController;
