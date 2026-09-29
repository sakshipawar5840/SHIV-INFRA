import { Router } from "express";
import { LeadController } from "../controllers/leadController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";
import { validateBody } from "../middleware/validator.ts";
import { leadSchema, updateLeadSchema } from "../middleware/leadValidator.ts";

export const leadRouter = Router();

leadRouter.get("/", authenticateJWT, LeadController.getLeads);

leadRouter.get(
  "/:id",
  authenticateJWT,
  LeadController.getLeadById
);

leadRouter.post(
  "/",
  authenticateJWT,
  validateBody(leadSchema),
  LeadController.createLead
);

leadRouter.put(
  "/:id",
  authenticateJWT,
  validateBody(updateLeadSchema),
  LeadController.updateLead
);

leadRouter.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles("Admin", "Super Admin"),
  LeadController.deleteLead
);
