import { Router } from "express";
import { CustomerController } from "../controllers/customerController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";
import { validateBody } from "../middleware/validator.ts";
import {
  customerSchema,
  updateCustomerSchema
} from "../middleware/customerValidator.ts";


export const customerRouter = Router();


// ===============================
// CUSTOMER READ
// ===============================

customerRouter.get(
  "/",
  authenticateJWT,
  CustomerController.getCustomers
);


customerRouter.get(
  "/:id",
  authenticateJWT,
  CustomerController.getCustomerById
);



// ===============================
// CUSTOMER CREATE
// ADMIN ACCESS
// ===============================

customerRouter.post(
  "/",
  authenticateJWT,
  authorizeRoles("admin", "superadmin"),
  validateBody(customerSchema),
  CustomerController.createCustomer
);



// ===============================
// CUSTOMER UPDATE
// ADMIN ACCESS
// ===============================

customerRouter.put(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin", "superadmin"),
  validateBody(updateCustomerSchema),
  CustomerController.updateCustomer
);



// ===============================
// CUSTOMER DELETE
// ADMIN ACCESS
// ===============================

customerRouter.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin", "superadmin"),
  CustomerController.deleteCustomer
);


export default customerRouter;