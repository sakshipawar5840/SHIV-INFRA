import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { inventoryService } from "../services/inventoryService.ts";

export class InventoryController {
  static async getItems(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { q } = req.query;
      const result = await inventoryService.list(companyId, q ? String(q) : undefined);
      return res.json({ success: true, count: result.count, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async getItemById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const item = await inventoryService.getById(id, companyId);
      if (!item) {
        return res.status(404).json({ success: false, message: "Inventory item not found" });
      }
      return res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  static async createItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const body = req.body;
      const result = await inventoryService.create(companyId, body, req.user!.id);
      return res.status(201).json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async updateItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const result = await inventoryService.update(id, companyId, req.body);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const result = await inventoryService.delete(id, companyId);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message, data: result.data });
    } catch (err) {
      next(err);
    }
  }
}

export default InventoryController;
