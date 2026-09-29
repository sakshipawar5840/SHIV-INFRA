import { Router } from "express";
import { BillController } from "../controllers/billController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";
import { upload } from "../middleware/upload.ts";
import { validateBody } from "../middleware/validator.ts";
import { billSchema, updateBillSchema } from "../middleware/billValidator.ts";


export const billRouter = Router();


billRouter.get(
  "/",
  authenticateJWT,
  BillController.getBills
);

billRouter.get(
  "/:id",
  authenticateJWT,
  BillController.getBillById
);

billRouter.post(
  "/",
  authenticateJWT,
  upload.single("bill"),
  validateBody(billSchema),
  BillController.uploadBill
);

billRouter.put(
  "/:id",
  authenticateJWT,
  validateBody(updateBillSchema),
  BillController.updateBill
);

billRouter.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles("Admin", "Super Admin"),
  BillController.deleteBill
);