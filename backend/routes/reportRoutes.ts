import { Router } from "express";
import { ReportController } from "../controllers/reportController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

export const reportRouter = Router();

reportRouter.get("/financial-summary", authenticateJWT, ReportController.getFinancialSummary);
reportRouter.get("/bills", authenticateJWT, ReportController.getBillsReport);
reportRouter.get("/expenses", authenticateJWT, ReportController.getExpensesReport);
reportRouter.get("/project/:project_id", authenticateJWT, ReportController.getProjectFinancial);
reportRouter.get("/generate", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer", "Sales Manager"), ReportController.generateReport);
