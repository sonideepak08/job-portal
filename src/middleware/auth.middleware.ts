import type { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";
import { envVariables } from "../config/env.ts";
import { Role } from "../generated/prisma/enums.ts";
import { prisma } from "../config/prisma.ts";
import { AppError } from "../utils/AppError.ts";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;
  const isBearerToken = authorization?.startsWith("Bearer ");
  if (!isBearerToken) {
    throw new AppError("Authorization token missing or invalid", 401);
  }
  const accessToken = authorization?.split(" ")[1];
  if (!accessToken) {
    throw new AppError("Authorization token missing or invalid", 401);
  }
  try {
    const decodedToken = jsonwebtoken.verify(
      accessToken,
      envVariables.JWT_SECRET,
    );
    if (typeof decodedToken === "string") {
      throw new AppError("Invalid or expired access token", 401);
    }
    if (
      typeof decodedToken.userId !== "number" ||
      !Object.values(Role).includes(decodedToken.role)
    ) {
      throw new AppError("Invalid access token payload", 401);
    }
    req.user = {
      userId: decodedToken.userId,
      role: decodedToken.role,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Invalid or expired access token", 401);
  }
};

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      throw new AppError("Invalid user or not found", 401);
    }
    const isRoleAllowed = allowedRoles.includes(user.role);
    if (!isRoleAllowed) {
      throw new AppError("You are not authorized to access this resource", 403);
    }
    next();
  };
};

export const authorizeJobOwnership = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const jobId = Number(req.params.jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    throw new AppError("Invalid jobId", 400);
  }

  const user = req.user;
  if (!user) {
    throw new AppError("Invalid user or not found", 401);
  }

  const jobDetails = await prisma.job.findUnique({
    where: {
      id: jobId,
    },
  });
  if (!jobDetails) {
    throw new AppError("Job not found", 404);
  }

  if (jobDetails.recruiterId !== user.userId) {
    throw new AppError("You are not authorized to modify this job", 403);
  }
  next();
};
