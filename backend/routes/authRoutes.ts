import { Router } from "express";

import { AuthController } from "../controllers/authController.ts";
import {
  validateBody,
  loginSchema,
  registerSchema
} from "../middleware/validator.ts";
import loginLimiter from "../middleware/loginLimiter.ts";


const authRouter = Router();



// ===============================
// REGISTER
// ===============================

authRouter.post(
  "/register",
  validateBody(registerSchema),
  AuthController.register
);



// ===============================
// LOGIN
// ===============================

authRouter.post(
  "/login",
  loginLimiter,
  validateBody(loginSchema),
  AuthController.login
);



// ===============================
// REFRESH TOKEN
// ===============================

authRouter.post(
  "/refresh",
  AuthController.refreshToken
);



// ===============================
// LOGOUT
// ===============================

authRouter.post(
  "/logout",
  AuthController.logout
);

authRouter.post(
  "/forgot-password",
  AuthController.forgotPassword
);



export default authRouter;