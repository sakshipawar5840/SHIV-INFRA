import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notificationService.ts";

export class NotificationController {
  /**
   * Fetch all notifications
   */
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await NotificationService.getAllNotifications();
      return res.status(200).json({
        success: true,
        data: list,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      const ok = await NotificationService.markAsRead(id);
      return res.status(200).json({
        success: ok,
        message: ok ? "Marked as read." : "Notification not found.",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAllAsRead();
      return res.status(200).json({
        success: true,
        message: "All notifications marked as read.",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      const ok = await NotificationService.deleteNotification(id);
      return res.status(200).json({
        success: ok,
        message: ok ? "Notification deleted." : "Notification not found.",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Trigger a client action to simulate real-time notification
   */
  static async triggerAction(req: Request, res: Response, next: NextFunction) {
    const { type, customerData } = req.body;
    if (!type || !customerData) {
      return res.status(400).json({
        success: false,
        error: "Both 'type' and 'customerData' parameters are required.",
      });
    }

    try {
      const result = await NotificationService.triggerCustomerActionNotification(type, customerData);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
export default NotificationController;
