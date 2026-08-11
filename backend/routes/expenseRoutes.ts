import { Router } from "express";
import { ExpenseController } from "../controllers/expenseController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";
import { validateBody, expenseSchema } from "../middleware/validator.ts";

export const expenseRouter = Router();

expenseRouter.get("/", authenticateJWT, ExpenseController.getExpenses);

expenseRouter.post(
  "/",
  authenticateJWT,
  validateBody(expenseSchema),
  ExpenseController.createExpense
);

expenseRouter.put("/:id", authenticateJWT, ExpenseController.updateExpense);

expenseRouter.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles("Admin", "Super Admin"),
  ExpenseController.deleteExpense
);
