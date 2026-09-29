import { Router } from "express";
import { UserController } from "../controllers/userController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

export const userRouter = Router();

userRouter.get("/", authenticateJWT, authorizeRoles("Admin", "Super Admin"), UserController.getUsers);
userRouter.get("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin"), UserController.getUserById);
userRouter.post("/", authenticateJWT, authorizeRoles("Admin", "Super Admin"), UserController.createUser);
userRouter.put("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin"), UserController.updateUser);
userRouter.delete("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin"), UserController.deleteUser);
