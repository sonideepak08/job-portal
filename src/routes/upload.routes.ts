import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.ts";
import { Role } from "../generated/prisma/enums.ts";
import { generateResumeUploadUrl } from "../controllers/upload.controller.ts";

const uploadRouter = Router();

uploadRouter.post(
  "/resume-url",
  authenticate,
  authorizeRoles(Role.CANDIDATE),
  generateResumeUploadUrl,
);

export default uploadRouter;
