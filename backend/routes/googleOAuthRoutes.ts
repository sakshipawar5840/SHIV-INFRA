// ============================================
// SHIVINFRA GOOGLE OAUTH ROUTES
// ============================================

import { Router, Request, Response } from "express";
import { GoogleOAuthService } from "../services/googleOAuthService.ts";
import { reinitializeGoogleClients } from "../services/googleService.ts";

const googleOAuthRouter = Router();

// GET /api/v1/google/oauth/start
// Redirects user to Google consent screen.
googleOAuthRouter.get(
  "/start",
  async (req: Request, res: Response) => {
    try {
      const authUrl = GoogleOAuthService.getAuthorizationUrl();
      return res.redirect(authUrl);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: "OAUTH_CONFIG_ERROR",
        message: error.message || "Google OAuth is not configured.",
      });
    }
  }
);

// GET /api/v1/google/oauth/callback
// Handles Google redirect with authorization code.
googleOAuthRouter.get(
  "/callback",
  async (req: Request, res: Response) => {
    try {
      const code = String(req.query.code || "").trim();

      if (!code) {
        return res.status(400).json({
          success: false,
          code: "MISSING_AUTH_CODE",
          message: "Authorization code is missing.",
        });
      }

      const tokens = await GoogleOAuthService.exchangeCode(code);

      if (tokens.refresh_token) {
        GoogleOAuthService.persistRefreshToken(tokens.refresh_token);
        reinitializeGoogleClients(tokens.refresh_token);
      }

      return res.json({
        success: true,
        message: "OAuth token exchange successful. Refresh token persisted.",
        data: {
          hasRefreshToken: !!tokens.refresh_token,
          scope: tokens.scope,
          tokenType: tokens.token_type,
          expiryDate: tokens.expiry_date,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: "OAUTH_CALLBACK_ERROR",
        message: error.message || "OAuth callback failed.",
      });
    }
  }
);

// GET /api/v1/google/oauth/status
// Returns safe configuration status.
googleOAuthRouter.get(
  "/status",
  (req: Request, res: Response) => {
    try {
      const status = GoogleOAuthService.getStatus();
      return res.json({
        success: true,
        ...status,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: "OAUTH_STATUS_ERROR",
        message: error.message || "Unable to determine OAuth status.",
      });
    }
  }
);

// POST /api/v1/google/oauth/revoke
// Revokes the current OAuth token (if needed).
googleOAuthRouter.post(
  "/revoke",
  async (req: Request, res: Response) => {
    try {
      const { token } = req.body || {};
      if (!token) {
        return res.status(400).json({
          success: false,
          code: "MISSING_TOKEN",
          message: "Token is required for revocation.",
        });
      }

      const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (response.ok) {
        return res.json({
          success: true,
          message: "Token revoked successfully.",
        });
      }

      const text = await response.text();
      return res.status(400).json({
        success: false,
        code: "REVOKE_FAILED",
        message: text || "Failed to revoke token.",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: "OAUTH_REVOKE_ERROR",
        message: error.message || "Token revocation failed.",
      });
    }
  }
);

export default googleOAuthRouter;
