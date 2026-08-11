import { Router } from "express";

import { AuthController } from "../controllers/authController.ts";
import {
  validateBody,
  loginSchema
} from "../middleware/validator.ts";


const authRouter = Router();



// ===============================
// REGISTER
// ===============================

authRouter.post(
  "/register",
  AuthController.register
);



// ===============================
// LOGIN
// ===============================

authRouter.post(
  "/login",
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
// FORGOT PASSWORD
// ===============================

authRouter.post(
  "/forgot-password",
  AuthController.forgotPassword
);



export default authRouter;