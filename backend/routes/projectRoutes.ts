import { Router } from "express";
import { ProjectController } from "../controllers/projectController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";
import { upload } from "../middleware/upload.ts";
import { validateBody, projectSchema } from "../middleware/validator.ts";

export const projectRouter = Router();


// ===============================
// PROJECT READ
// ===============================

projectRouter.get(
  "/",
  authenticateJWT,
  ProjectController.getProjects
);


projectRouter.get(
  "/:id",
  authenticateJWT,
  ProjectController.getProjectById
);


// ===============================
// PROJECT CREATE
// ADMIN ACCESS
// ===============================

projectRouter.post(
  "/",
  authenticateJWT,
  authorizeRoles("admin", "superadmin"),
  upload.single("brochure"),
  validateBody(projectSchema),
  ProjectController.createProject
);


// ===============================
// PROJECT UPDATE
// ===============================

projectRouter.put(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin", "superadmin"),
  upload.single("brochure"),
  ProjectController.updateProject
);


// ===============================
// PROJECT DELETE
// ===============================

projectRouter.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin", "superadmin"),
  ProjectController.deleteProject
);