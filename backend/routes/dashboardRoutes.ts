import { Router } from "express";
import { DashboardController } from "../controllers/dashboardController.ts";
import { authenticateJWT } from "../middleware/auth.ts";


export const dashboardRouter = Router();


dashboardRouter.get(
  "/",
  authenticateJWT,
  DashboardController.getDashboard
);