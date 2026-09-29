import { Router } from "express";
import { TaskController } from "../controllers/taskController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

export const taskRouter = Router();

taskRouter.get("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer", "Customer"), TaskController.getTasks);
taskRouter.get("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer", "Customer"), TaskController.getTaskById);
taskRouter.post("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer"), TaskController.createTask);
taskRouter.put("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer"), TaskController.updateTask);
taskRouter.delete("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin"), TaskController.deleteTask);
