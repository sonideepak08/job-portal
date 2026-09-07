import type { Request, Response } from "express";
import {
  createJobSchema,
  jobQuerySchema,
  updateJobSchema,
} from "../validators/job.validator.ts";
import { z } from "zod";
import { prisma } from "../config/prisma.ts";
import { JobStatus } from "../generated/prisma/enums.ts";
import type { JobWhereInput } from "../generated/prisma/models.ts";
import { redisClient } from "../config/redis.ts";
import { AppError } from "../utils/AppError.ts";
import { sendSuccess } from "../utils/sendSuccess.ts";

export const createJob = async (req: Request, res: Response) => {
  const result = createJobSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError("Validation failed", 400, z.treeifyError(result.error));
  }

  const { title, company, description, experience, location, skills, jobType } =
    result.data;

  const user = req.user;
  if (!user) {
    throw new AppError("Invalid user or not found", 401);
  }

  const recruiterId = user.userId;

  const { job, skillRecords } = await prisma.$transaction(async (tx) => {
    const skillUpsertPromises = skills.map((skill) => {
      const normalizedSkill = skill.toLowerCase();

      return tx.skill.upsert({
        where: {
          normalizedName: normalizedSkill,
        },
        update: {},
        create: {
          name: skill,
          normalizedName: normalizedSkill,
        },
      });
    });

    const skillRecords = await Promise.all(skillUpsertPromises);

    const job = await tx.job.create({
      data: {
        company,
        description,
        experience,
        location,
        title,
        recruiterId,
        jobType,
      },
    });

    const jobSkillData = skillRecords.map((skill) => {
      return {
        jobId: job.id,
        skillId: skill.id,
      };
    });

    await tx.jobSkill.createMany({
      data: jobSkillData,
    });

    return {
      job,
      skillRecords,
    };
  });

  const cacheKey = "jobs:active:page:1:limit:10";
  await redisClient.del(cacheKey);

  const responseSkills = skillRecords.map((skill) => {
    return {
      id: skill.id,
      name: skill.name,
    };
  });

  return sendSuccess(res, 201, "Job created successfully", {
    id: job.id,
    company: job.company,
    description: job.description,
    experience: job.experience,
    location: job.location,
    skills: responseSkills,
    title: job.title,
    recruiterId: job.recruiterId,
    jobType: job.jobType,
  });
};

export const updateJob = async (req: Request, res: Response) => {
  const result = updateJobSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError("Validation failed", 400, z.treeifyError(result.error));
  }

  const jobId = Number(req.params.jobId);

  const updatedJob = await prisma.job.update({
    where: {
      id: jobId,
    },
    data: result.data,
  });

  const cacheKey = "jobs:active:page:1:limit:10";
  await redisClient.del(cacheKey);

  return sendSuccess(res, 200, "Job updated successfully", updatedJob);
};

export const closeJob = async (req: Request, res: Response) => {
  const jobId = Number(req.params.jobId);

  const closedJob = await prisma.job.update({
    where: {
      id: jobId,
    },
    data: {
      status: JobStatus.CLOSED,
    },
  });

  const cacheKey = "jobs:active:page:1:limit:10";
  await redisClient.del(cacheKey);

  return sendSuccess(res, 200, "Job closed successfully", closedJob);
};

export const getActiveJobs = async (req: Request, res: Response) => {
  const result = jobQuerySchema.safeParse(req.query);
  if (!result.success) {
    throw new AppError("Validation failed", 400, z.treeifyError(result.error));
  }

  const { page, limit, location, experience, skills, jobType, search } =
    result.data;

  const skip = (page - 1) * limit;
  const take = limit;

  const isHotQuery =
    page === 1 &&
    limit === 10 &&
    location === undefined &&
    experience === undefined &&
    skills === undefined &&
    jobType === undefined &&
    search === undefined;

  const cacheKey = "jobs:active:page:1:limit:10";
  if (isHotQuery) {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("cache HIT");
      const parsedCached = JSON.parse(cached);
      return sendSuccess(
        res,
        200,
        "Jobs fetched successfully",
        parsedCached.data,
        parsedCached.meta,
      );
    }
    console.log("cache MISS");
  }

  let skillsArray: string[] | undefined;
  if (skills) {
    skillsArray = skills.split(",").map((skill) => skill.trim().toLowerCase());
  }

  const filters: JobWhereInput = {
    status: JobStatus.ACTIVE,
    location,
    experience,
    jobType,
  };

  if (skillsArray && skillsArray.length > 0) {
    filters.jobSkills = {
      some: {
        skill: {
          normalizedName: {
            in: skillsArray,
          },
        },
      },
    };
  }

  if (search) {
    filters.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        company: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        jobSkills: {
          some: {
            skill: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      },
    ];
  }

  const jobRecords = await prisma.job.findMany({
    where: filters,
    skip,
    take,
    orderBy: {
      id: "desc",
    },
  });

  const totalJobs = await prisma.job.count({
    where: filters,
  });

  const totalPages = Math.ceil(totalJobs / limit);

  const responseData = {
    data: jobRecords,
    meta: {
      pagination: {
        currentPage: page,
        limit,
        totalRecords: totalJobs,
        totalPages,
      },
    },
  };
  if (isHotQuery) {
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      expiration: {
        type: "EX",
        value: 60,
      },
    });
  }

  return sendSuccess(
    res,
    200,
    "Jobs fetched successfully",
    responseData.data,
    responseData.meta,
  );
};

export const getMyJobs = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Invalid user or not found", 401);
  }
  const userId = user.userId;

  const jobRecords = await prisma.job.findMany({
    where: {
      recruiterId: userId,
    },
  });

  return sendSuccess(res, 200, "Jobs fetched successfully", jobRecords);
};
