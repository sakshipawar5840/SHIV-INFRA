// =====================================================
// SHIVINFRA BROADCAST ROUTES
// WhatsApp Broadcast Messaging API
// =====================================================

import { Router } from "express";
import { BroadcastController } from "../controllers/broadcastController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

const router = Router();

// =====================================================
// CREATE BROADCAST
// POST /api/v1/broadcasts
// Admin only
// =====================================================
router.post(
    "/",
    authenticateJWT,
    authorizeRoles("admin", "superadmin"),
    BroadcastController.createBroadcast
);

// =====================================================
// LIST BROADCASTS
// GET /api/v1/broadcasts
// Admin only
// =====================================================
router.get(
    "/",
    authenticateJWT,
    authorizeRoles("admin", "superadmin"),
    BroadcastController.listBroadcasts
);

// =====================================================
// GET BROADCAST STATISTICS
// GET /api/v1/broadcasts/stats
// Admin only
// =====================================================
router.get(
    "/stats",
    authenticateJWT,
    authorizeRoles("admin", "superadmin"),
    BroadcastController.getBroadcastStats
);

// =====================================================
// GET BROADCAST BY ID
// GET /api/v1/broadcasts/:id
// Admin only
// =====================================================
router.get(
    "/:id",
    authenticateJWT,
    authorizeRoles("admin", "superadmin"),
    BroadcastController.getBroadcastById
);

export default router;
