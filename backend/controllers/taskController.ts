import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { taskService } from "../services/taskService.ts";

export class TaskController {
  static async getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { q, status } = req.query;
      const result = await taskService.list(companyId, q ? String(q) : undefined);
      return res.json({ success: true, count: result.count, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async getTaskById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const task = await taskService.getById(id, companyId);
      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }
      return res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  static async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const result = await taskService.create(companyId, req.body, req.user!.id);
      return res.status(201).json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const result = await taskService.update(id, companyId, req.body);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const result = await taskService.delete(id, companyId);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }
}

export default TaskController;
