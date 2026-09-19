import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../controllers/auth.controller.ts";

const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               role:
 *                 type: string
 *                 enum:
 *                   - RECRUITER
 *                   - CANDIDATE
 */
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refreshToken);
authRouter.post("/logout", logout);

export default authRouter;
