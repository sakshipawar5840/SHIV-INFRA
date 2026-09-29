import { Router } from "express";
import { VendorController } from "../controllers/vendorController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

export const vendorRouter = Router();

vendorRouter.get("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer", "Customer"), VendorController.getVendors);
vendorRouter.get("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer", "Customer"), VendorController.getVendorById);
vendorRouter.post("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer"), VendorController.createVendor);
vendorRouter.put("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer"), VendorController.updateVendor);
vendorRouter.delete("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin"), VendorController.deleteVendor);
