import { Router } from "express";
import { SiteVisitController } from "../controllers/siteVisitController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

export const siteVisitRouter = Router();

siteVisitRouter.get("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer", "Customer"), SiteVisitController.getVisits);

siteVisitRouter.post("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer"), SiteVisitController.createVisit);

siteVisitRouter.put("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer"), SiteVisitController.updateVisit);

siteVisitRouter.delete("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin"), SiteVisitController.deleteVisit);
