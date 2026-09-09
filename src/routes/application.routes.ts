import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.ts";
import { applyToJob } from "../controllers/application.controller.ts";
import { Role } from "../generated/prisma/enums.ts";
import { saveResumeMetadata } from "../controllers/resume.controller.ts";

const applicationRouter = Router();

applicationRouter.post(
  "/:jobId",
  authenticate,
  authorizeRoles(Role.CANDIDATE),
  applyToJob,
);

applicationRouter.post(
  "/:applicationId/resume",
  authenticate,
  authorizeRoles(Role.CANDIDATE),
  saveResumeMetadata,
);

export default applicationRouter;
