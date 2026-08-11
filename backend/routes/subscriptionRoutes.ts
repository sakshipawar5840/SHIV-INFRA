import { Router } from "express";
import { SubscriptionController } from "../controllers/subscriptionController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

export const subscriptionRouter = Router();

subscriptionRouter.get("/", authenticateJWT, SubscriptionController.getSubscription);

subscriptionRouter.post(
  "/renew",
  authenticateJWT,
  authorizeRoles("Admin", "Super Admin"),
  SubscriptionController.renewSubscription
);
