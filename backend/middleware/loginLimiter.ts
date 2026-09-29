// =====================================================
// SHIVINFRA LOGIN BRUTE-FORCE PROTECTION
// Narrow, additive middleware — does not alter the
// existing auth architecture, JWT, or role logic.
// =====================================================

import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

/**
 * Login rate limiter.
 *
 * Per-IP brute-force protection for the login endpoint only.
 * Failed and successful logins both count toward the window so a
 * single attacker cannot probe many accounts from one IP.
 *
 * Limits are intentionally generous for legitimate Admins:
 *   - 10 attempts per IP per 15 minutes
 *   - temporary lockout only; never permanently disables an account
 *
 * Legitimate business-partner Admins are never affected because a
 * real person logging in hits this limit only after many failures.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many login attempts. Please try again in 15 minutes.",
  },
  // Only applies to the login route — no other endpoint is affected.
});

export default loginLimiter;