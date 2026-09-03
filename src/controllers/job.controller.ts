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

export const createJob = async (req: Request, res: Response) => {
  const result = createJobSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.treeifyError(result.error),
    });
  }

  const { title, company, description, experience, location, skills, jobType } =
    result.data;

  const user = req.user;
  if (!user) {
    return res.status(401).json({
      message: "Invalid user or not found",
    });
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

  const responseSkills = skillRecords.map((skill) => {
    return {
      id: skill.id,
      name: skill.name,
    };
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
      skills: responseSkills,
      title: job.title,
      recruiterId: job.recruiterId,
      jobType: job.jobType,
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
  const result = jobQuerySchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.treeifyError(result.error),
    });
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
      return res.status(200).json(JSON.parse(cached));
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
    success: true,
    data: jobRecords,
    pagination: {
      currentPage: page,
      limit,
      totalRecords: totalJobs,
      totalPages,
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

  return res.status(200).json(responseData);
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
