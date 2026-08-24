import type { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";
import { envVariables } from "../config/env.ts";
import { Role } from "../generated/prisma/enums.ts";
import { prisma } from "../config/prisma.ts";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;
  const isBearerToken = authorization?.startsWith("Bearer ");
  if (!isBearerToken) {
    return res.status(401).json({
      message: "Invalid access token",
    });
  }
  const accessToken = authorization?.split(" ")[1];
  if (!accessToken) {
    return res.status(401).json({
      message: "Authorization token missing or invalid",
    });
  }
  try {
    const decodedToken = jsonwebtoken.verify(
      accessToken,
      envVariables.JWT_SECRET,
    );
    if (typeof decodedToken === "string") {
      return res.status(401).json({
        message: "Invalid access token",
      });
    }
    if (
      typeof decodedToken.userId !== "number" ||
      !Object.values(Role).includes(decodedToken.role)
    ) {
      return res.status(401).json({
        message: "Invalid access token payload",
      });
    }
    req.user = {
      userId: decodedToken.userId,
      role: decodedToken.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired access token",
    });
  }
};

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "Invalid user or not found",
      });
    }
    const isRoleAllowed = allowedRoles.includes(user.role);
    if (!isRoleAllowed) {
      return res.status(403).json({
        message: "You are not authorized to access this resource",
      });
    }
    next();
  };
};

export const authorizeJobOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const jobId = Number(req.params.jobId);
  console.log("jobId", jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return res.status(400).json({
      message: "Invalid jobId",
    });
  }

  const user = req.user;
  if (!user) {
    return res.status(401).json({
      message: "Invalid user or not found",
    });
  }

  const jobDetails = await prisma.job.findUnique({
    where: {
      id: jobId,
    },
  });
  if (!jobDetails) {
    return res.status(404).json({
      message: "Invalid job or not found",
    });
  }

  if (jobDetails.recruiterId !== user.userId) {
    return res.status(403).json({
      message: "You are not authorized to modify this job",
    });
  }
  next();
};
