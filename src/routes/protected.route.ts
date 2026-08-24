import { Router } from "express";
import {
  authenticate,
  authorizeJobOwnership,
  authorizeRoles,
} from "../middleware/auth.middleware.ts";
import { Role } from "../generated/prisma/enums.ts";

const router = Router();

router.get(
  "/recruiter-only",
  authenticate,
  authorizeRoles(Role.RECRUITER),
  (req, res) => {
    return res.status(200).json({
      message: "Recruiter route accessed",
    });
  },
);

router.get(
  "/candidate-only",
  authenticate,
  authorizeRoles(Role.CANDIDATE),
  (req, res) => {
    return res.status(200).json({
      message: "candidate route accessed",
    });
  },
);

router.patch(
  "/jobs/:jobId",
  authenticate,
  authorizeRoles(Role.RECRUITER),
  authorizeJobOwnership,
  (req, res) => {
    return res.status(200).json({
      message: "valid user to update",
    });
  },
);

export default router;
