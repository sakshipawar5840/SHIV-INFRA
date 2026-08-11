import { Router } from "express";
import { NotificationController } from "../controllers/notificationController.ts";

export const notificationRouter = Router();

// Retrieve list
notificationRouter.get("/", NotificationController.getNotifications);

// Simulated actions trigger
notificationRouter.post("/trigger", NotificationController.triggerAction);

// Read-all
notificationRouter.put("/read-all", NotificationController.markAllAsRead);

// Single read
notificationRouter.put("/:id/read", NotificationController.markAsRead);

// Delete
notificationRouter.delete("/:id", NotificationController.deleteNotification);

export default notificationRouter;
