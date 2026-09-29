import { Router } from "express";
import { SettingController } from "../controllers/settingController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

export const settingRouter = Router();

settingRouter.get("/", authenticateJWT, authorizeRoles("Admin", "Super Admin"), SettingController.getSettings);
settingRouter.put("/", authenticateJWT, authorizeRoles("Admin", "Super Admin"), SettingController.updateSettings);
