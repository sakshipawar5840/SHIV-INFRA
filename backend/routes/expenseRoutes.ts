import { Router } from "express";
import { ExpenseController } from "../controllers/expenseController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";
import { validateBody } from "../middleware/validator.ts";
import { expenseSchema, updateExpenseSchema } from "../middleware/expenseValidator.ts";

export const expenseRouter = Router();

expenseRouter.get("/", authenticateJWT, ExpenseController.getExpenses);

expenseRouter.get(
  "/:id",
  authenticateJWT,
  ExpenseController.getExpenseById
);

expenseRouter.post(
  "/",
  authenticateJWT,
  validateBody(expenseSchema),
  ExpenseController.createExpense
);

expenseRouter.put(
  "/:id",
  authenticateJWT,
  validateBody(updateExpenseSchema),
  ExpenseController.updateExpense
);

expenseRouter.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles("Admin", "Super Admin"),
  ExpenseController.deleteExpense
);
