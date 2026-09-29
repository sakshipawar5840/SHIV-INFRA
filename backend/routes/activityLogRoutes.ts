import { Router } from "express";
import { ActivityLogController } from "../controllers/activityLogController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

export const activityLogRouter = Router();

activityLogRouter.get("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer"), ActivityLogController.getLogs);
activityLogRouter.post("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer"), ActivityLogController.createLog);
