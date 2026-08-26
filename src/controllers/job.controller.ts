import type { Request, Response } from "express";
import {
  createJobSchema,
  updateJobSchema,
} from "../validators/job.validator.ts";
import { z } from "zod";
import { prisma } from "../config/prisma.ts";
import { JobStatus } from "../generated/prisma/enums.ts";

export const createJob = async (req: Request, res: Response) => {
  const result = createJobSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.treeifyError(result.error),
    });
  }

  const { title, company, description, experience, location, skills } =
    result.data;

  const user = req.user;
  if (!user) {
    return res.status(401).json({
      message: "Invalid user or not found",
    });
  }
  const recruiterId = user.userId;

  const job = await prisma.job.create({
    data: {
      company,
      description,
      experience,
      location,
      skills,
      title,
      recruiterId,
    },
  });

  return res.status(201).json({
    success: true,
    message: "job created successfully",
    data: {
      id: job.id,
      company: job.company,
      description: job.description,
      experience: job.experience,
      location: job.location,
      skills: job.skills,
      title: job.title,
      recruiterId: job.recruiterId,
    },
  });
};

export const updateJob = async (req: Request, res: Response) => {
  const result = updateJobSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.treeifyError(result.error),
    });
  }

  const jobId = Number(req.params.jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return res.status(400).json({
      message: "Invalid jobId",
    });
  }

  await prisma.job.update({
    where: {
      id: jobId,
    },
    data: result.data,
  });

  return res.status(200).json({
    message: "job updated successfully",
  });
};

export const closeJob = async (req: Request, res: Response) => {
  const jobId = Number(req.params.jobId);

  await prisma.job.update({
    where: {
      id: jobId,
    },
    data: {
      status: JobStatus.CLOSED,
    },
  });

  return res.status(200).json({
    message: "job closed successfully",
  });
};

export const getActiveJobs = async (req: Request, res: Response) => {
  const jobRecords = await prisma.job.findMany({
    where: {
      status: JobStatus.ACTIVE,
    },
  });

  return res.status(200).json({
    success: true,
    data: jobRecords,
  });
};

export const getMyJobs = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      message: "Invalid user or not found",
    });
  }
  const userId = user.userId;

  const jobRecords = await prisma.job.findMany({
    where: {
      recruiterId: userId,
    },
  });

  return res.status(200).json({
    success: true,
    data: jobRecords,
  });
};
