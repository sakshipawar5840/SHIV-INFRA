import { Router } from "express";
import { ReportController } from "../controllers/reportController.ts";
import { authenticateJWT } from "../middleware/auth.ts";

export const reportRouter = Router();

// Secure endpoint allowing executives to compile spreadsheets
reportRouter.get("/generate", authenticateJWT, ReportController.generateReport);
