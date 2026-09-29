import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { userService } from "../services/userService.ts";

export class UserController {
  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { q } = req.query;
      const result = await userService.list(companyId, q ? String(q) : undefined);
      return res.json({ success: true, count: result.count, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const user = await userService.getById(id, companyId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const result = await userService.create({ ...req.body, company_id: companyId });
      return res.status(201).json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const result = await userService.update(id, companyId, req.body);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const result = await userService.delete(id, companyId);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }
}

export default UserController;
