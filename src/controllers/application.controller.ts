import type { Request, Response } from "express";
import { applyToJobSchema } from "../validators/application.validator.ts";
import { AppError } from "../utils/AppError.ts";
import { z } from "zod";
import { prisma } from "../config/prisma.ts";
import { ApplicationStatus, JobStatus } from "../generated/prisma/enums.ts";
import { sendSuccess } from "../utils/sendSuccess.ts";
import { Prisma } from "../generated/prisma/client.ts";
import {
  applicationStatusParamsSchema,
  updateApplicationStatusSchema,
} from "../validators/applicationStatus.validator.ts";

const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["HIRED", "REJECTED"],
  REJECTED: [],
  HIRED: [],
};

export const applyToJob = async (req: Request, res: Response) => {
  const result = applyToJobSchema.safeParse(req.params);
  if (!result.success) {
    throw new AppError("Invalid jobId", 400, z.treeifyError(result.error));
  }

  const { jobId } = result.data;
  const jobDetails = await prisma.job.findUnique({
    where: {
      id: jobId,
    },
  });
  if (!jobDetails) {
    throw new AppError("Job doesn't exist", 404);
  }

  if (jobDetails.status !== JobStatus.ACTIVE) {
    throw new AppError("Job is closed", 409);
  }

  const user = req.user!;
  try {
    const appliedJob = await prisma.application.create({
      data: {
        jobId,
        candidateId: user.userId,
      },
    });

    return sendSuccess(res, 201, "Job applied successfully", appliedJob);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("You have already applied to this job", 409);
    }
    throw error;
  }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
  const applicationStatusParamsResult = applicationStatusParamsSchema.safeParse(
    req.params,
  );
  if (!applicationStatusParamsResult.success) {
    throw new AppError(
      "Invalid applicationId",
      400,
      z.treeifyError(applicationStatusParamsResult.error),
    );
  }

  const updateApplicationStatusResult = updateApplicationStatusSchema.safeParse(
    req.body,
  );
  if (!updateApplicationStatusResult.success) {
    throw new AppError(
      "Invalid application status",
      400,
      z.treeifyError(updateApplicationStatusResult.error),
    );
  }

  const { applicationId } = applicationStatusParamsResult.data;
  const { status } = updateApplicationStatusResult.data;

  const application = await prisma.application.findUnique({
    where: {
      id: applicationId,
    },
    select: {
      id: true,
      status: true,
      job: {
        select: {
          recruiterId: true,
        },
      },
    },
  });
  if (!application) {
    throw new AppError("Application does not exist", 404);
  }

  const recruiter = req.user!;
  if (application.job.recruiterId !== recruiter.userId) {
    throw new AppError(
      "You're not authorized to update the application status",
      403,
    );
  }

  if (!allowedTransitions[application.status].includes(status)) {
    throw new AppError("Invalid application status transition", 409);
  }

  // Conditional atomic update: change status only if it still matches the value we validated, preventing stale concurrent writes.
  const updateApplicationStatusResponse = await prisma.application.updateMany({
    where: {
      id: applicationId,
      status: application.status,
    },
    data: {
      status,
    },
  });

  if (updateApplicationStatusResponse.count === 0) {
    throw new AppError("Application status changed. Please retry.", 409);
  }
  const updatedApplication = await prisma.application.findUnique({
    where: {
      id: applicationId,
    },
  });

  return sendSuccess(
    res,
    200,
    "Status successfully updated",
    updatedApplication,
  );
};
