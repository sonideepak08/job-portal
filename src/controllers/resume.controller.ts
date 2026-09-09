import type { Request, Response } from "express";
import {
  applicationIdSchema,
  resumeMetadataSchema,
} from "../validators/resume.validator.ts";
import { AppError } from "../utils/AppError.ts";
import { prisma } from "../config/prisma.ts";
import { sendSuccess } from "../utils/sendSuccess.ts";
import { Prisma } from "../generated/prisma/client.ts";
import { z } from "zod";

export const saveResumeMetadata = async (req: Request, res: Response) => {
  const applicationIdResult = applicationIdSchema.safeParse(req.params);
  if (!applicationIdResult.success) {
    throw new AppError(
      "Invalid ApplicationId",
      400,
      z.treeifyError(applicationIdResult.error),
    );
  }

  const resumeMetadataResult = resumeMetadataSchema.safeParse(req.body);
  if (!resumeMetadataResult.success) {
    throw new AppError(
      "Invalid resume metadata",
      400,
      z.treeifyError(resumeMetadataResult.error),
    );
  }

  const { applicationId } = applicationIdResult.data;
  const { contentType, fileName, fileSize, resumeKey } =
    resumeMetadataResult.data;

  const candidate = req.user!;

  const applicationRecord = await prisma.application.findUnique({
    where: {
      id: applicationId,
    },
  });
  if (!applicationRecord) {
    throw new AppError("Application doesn't exist", 404);
  }

  if (applicationRecord.candidateId !== candidate.userId) {
    throw new AppError("Incorrect application", 403);
  }

  if (!resumeKey.startsWith(`resumes/${candidate.userId}/`)) {
    throw new AppError("Incorrect resume path key", 400);
  }

  try {
    const resume = await prisma.resume.create({
      data: {
        contentType,
        fileName,
        fileSize,
        resumeKey,
        applicationId,
        candidateId: applicationRecord.candidateId,
      },
    });
    return sendSuccess(res, 201, "Resume recorded successfully", resume);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("Resume already linked to this application", 409);
    }
    throw error;
  }
};
