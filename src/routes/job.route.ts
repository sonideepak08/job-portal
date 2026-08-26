import { Router } from "express";
import {
  closeJob,
  createJob,
  getActiveJobs,
  getMyJobs,
  updateJob,
} from "../controllers/job.controller.ts";
import {
  authenticate,
  authorizeJobOwnership,
  authorizeRoles,
} from "../middleware/auth.middleware.ts";
import { Role } from "../generated/prisma/enums.ts";

const jobRouter = Router();

jobRouter.get("/", authenticate, authorizeRoles(Role.CANDIDATE), getActiveJobs);

jobRouter.get(
  "/my-jobs",
  authenticate,
  authorizeRoles(Role.RECRUITER),
  getMyJobs,
);

jobRouter.post("/", authenticate, authorizeRoles(Role.RECRUITER), createJob);

jobRouter.patch(
  "/:jobId",
  authenticate,
  authorizeRoles(Role.RECRUITER),
  authorizeJobOwnership,
  updateJob,
);

jobRouter.patch(
  "/:jobId/close",
  authenticate,
  authorizeRoles(Role.RECRUITER),
  authorizeJobOwnership,
  closeJob,
);

export default jobRouter;
