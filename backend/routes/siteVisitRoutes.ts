import { Router } from "express";
import { SiteVisitController } from "../controllers/siteVisitController.ts";
import { authenticateJWT } from "../middleware/auth.ts";

export const siteVisitRouter = Router();

siteVisitRouter.get("/", authenticateJWT, SiteVisitController.getVisits);

siteVisitRouter.post("/", authenticateJWT, SiteVisitController.createVisit);

siteVisitRouter.put("/:id", authenticateJWT, SiteVisitController.updateVisit);

siteVisitRouter.delete("/:id", authenticateJWT, SiteVisitController.deleteVisit);
