// =====================================================
// SHIVINFRA MESSAGING CHANNEL ROUTES
// /api/v1/channels/*
// =====================================================

import { Router } from "express";
import { ChannelController } from "../controllers/channelController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

const router = Router();

// GET channel configuration status (no secrets returned)
router.get(
    "/status",
    authenticateJWT,
    authorizeRoles("admin", "superadmin"),
    ChannelController.getChannelStatus
);

// POST test each channel
router.post(
    "/whatsapp/test",
    authenticateJWT,
    authorizeRoles("admin", "superadmin"),
    ChannelController.testWhatsApp
);

router.post(
    "/facebook/test",
    authenticateJWT,
    authorizeRoles("admin", "superadmin"),
    ChannelController.testFacebook
);

router.post(
    "/instagram/test",
    authenticateJWT,
    authorizeRoles("admin", "superadmin"),
    ChannelController.testInstagram
);

router.post(
    "/sms/test",
    authenticateJWT,
    authorizeRoles("admin", "superadmin"),
    ChannelController.testSms
);

export default router;
