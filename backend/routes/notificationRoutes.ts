import { Router } from "express";
import { NotificationController } from "../controllers/notificationController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

export const notificationRouter = Router();

// Retrieve list
notificationRouter.get("/", authenticateJWT, NotificationController.getNotifications);

// Simulated actions trigger
notificationRouter.post("/trigger", authenticateJWT, authorizeRoles("Admin", "Super Admin"), NotificationController.triggerAction);

// Read-all
notificationRouter.put("/read-all", authenticateJWT, authorizeRoles("Admin", "Super Admin"), NotificationController.markAllAsRead);

// Single read
notificationRouter.put("/:id/read", authenticateJWT, authorizeRoles("Admin", "Super Admin"), NotificationController.markAsRead);

// Delete
notificationRouter.delete("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin"), NotificationController.deleteNotification);

export default notificationRouter;
