import { Router } from "express";
import { DashboardController } from "../controllers/dashboardController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";


export const dashboardRouter = Router();


dashboardRouter.get(
  "/",
  authenticateJWT,
  authorizeRoles("Admin", "Super Admin", "Engineer", "Sales Manager", "Customer"),
  DashboardController.getDashboard
);