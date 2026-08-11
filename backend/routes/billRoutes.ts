import { Router } from "express";
import { BillController } from "../controllers/billController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";
import { upload } from "../middleware/upload.ts";


export const billRouter = Router();


// ===============================
// GET ALL BILLS
// ===============================
billRouter.get(
  "/",
  authenticateJWT,
  BillController.getBills
);



// ===============================
// GET SINGLE BILL
// ===============================
billRouter.get(
  "/:id",
  authenticateJWT,
  BillController.getBillById
);



// ===============================
// CREATE BILL
// ===============================
billRouter.post(
  "/",
  authenticateJWT,
  upload.single("bill"),
  BillController.uploadBill
);



// ===============================
// UPDATE BILL
// ===============================
billRouter.put(
  "/:id",
  authenticateJWT,
  BillController.updateBill
);



// ===============================
// DELETE BILL
// ===============================
billRouter.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles("Admin", "Super Admin"),
  BillController.deleteBill
);