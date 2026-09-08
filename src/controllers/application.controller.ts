import type { Request, Response } from "express";
import { applyToJobSchema } from "../validators/application.validator.ts";
import { AppError } from "../utils/AppError.ts";
import { z } from "zod";
import { prisma } from "../config/prisma.ts";
import { JobStatus } from "../generated/prisma/enums.ts";
import { sendSuccess } from "../utils/sendSuccess.ts";
import { Prisma } from "../generated/prisma/client.ts";

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
