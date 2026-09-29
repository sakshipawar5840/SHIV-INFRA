import { Router } from "express";
import { DocumentController } from "../controllers/documentController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";
import { upload } from "../middleware/upload.ts";

export const documentRouter = Router();

documentRouter.get("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer", "Customer"), DocumentController.getDocuments);
documentRouter.get("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer", "Customer"), DocumentController.getDocumentById);
documentRouter.post("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer"), upload.single("file"), DocumentController.createDocument);
documentRouter.put("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin"), DocumentController.updateDocument);
documentRouter.delete("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin"), DocumentController.deleteDocument);
documentRouter.get("/:path/signed-url", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer", "Customer"), DocumentController.getSignedUrl);
