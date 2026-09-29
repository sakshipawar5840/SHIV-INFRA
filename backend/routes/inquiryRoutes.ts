import { Router } from "express";
import { InquiryController } from "../controllers/inquiryController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

export const inquiryRouter = Router();

inquiryRouter.get("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Sales Manager", "Engineer"), InquiryController.getInquiries);
inquiryRouter.get("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Sales Manager", "Engineer"), InquiryController.getInquiryById);
inquiryRouter.post("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Sales Manager"), InquiryController.createInquiry);
inquiryRouter.put("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Sales Manager"), InquiryController.updateInquiry);
inquiryRouter.delete("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin"), InquiryController.deleteInquiry);
