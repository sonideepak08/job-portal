import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.ts";
import { applyToJob } from "../controllers/application.controller.ts";
import { Role } from "../generated/prisma/enums.ts";

const applicationRouter = Router();

applicationRouter.post(
  "/:jobId",
  authenticate,
  authorizeRoles(Role.CANDIDATE),
  applyToJob,
);

export default applicationRouter;
