import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from "../validators/auth.validator.ts";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.ts";
import type { Request, Response } from "express";
import { z } from "zod";
import jsonwebtoken from "jsonwebtoken";
import { envVariables } from "../config/env.ts";
import crypto from "crypto";
import { RevokedReason } from "../generated/prisma/enums.ts";
import { AppError } from "../utils/AppError.ts";
import { sendSuccess } from "../utils/sendSuccess.ts";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export const register = async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Validation failed", 400, z.treeifyError(result.error));
  }

  const data = result.data;
  const { name, email, password, role } = data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  return sendSuccess(res, 201, "User registered successfully", {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

export const login = async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Validation failed", 400, z.treeifyError(result.error));
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new AppError("Invalid email or password", 401);
  }

  const payload = {
    userId: user.id,
    role: user.role,
  };
  const accessToken = jsonwebtoken.sign(payload, envVariables.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = crypto.randomBytes(32).toString("hex");
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const familyId = crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(
        Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * MILLISECONDS_PER_DAY,
      ),
      createdAt: new Date(),
      familyId,
    },
  });

  return sendSuccess(res, 200, "Login successful", {
    accessToken,
    refreshToken,
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const result = refreshTokenSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Validation failed", 400, z.treeifyError(result.error));
  }

  const { refreshToken } = result.data;
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const refreshTokenRecord = await prisma.refreshToken.findUnique({
    where: {
      tokenHash: refreshTokenHash,
    },
  });

  if (!refreshTokenRecord) {
    throw new AppError("Refresh token not valid", 401);
  }

  const isRefreshTokenRevoked = !!refreshTokenRecord.revokedAt;

  if (isRefreshTokenRevoked) {
    if (refreshTokenRecord.revokedReason === RevokedReason.ROTATED) {
      await prisma.refreshToken.updateMany({
        where: {
          familyId: refreshTokenRecord.familyId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: RevokedReason.REUSE_DETECTED,
        },
      });
    }
    throw new AppError("Refresh token is revoked", 401);
  }

  const isRefreshTokenExpired =
    refreshTokenRecord.expiresAt.getTime() < Date.now();

  if (isRefreshTokenExpired) {
    throw new AppError("Refresh token is expired", 401);
  }

  const userId = refreshTokenRecord.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError("Invalid refresh token", 401);
  }

  const newRefreshToken = crypto.randomBytes(32).toString("hex");
  const newRefreshTokenHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  const refreshTokenExpiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * MILLISECONDS_PER_DAY,
  );

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: {
        id: refreshTokenRecord.id,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: RevokedReason.ROTATED,
      },
    }),

    prisma.refreshToken.create({
      data: {
        userId: refreshTokenRecord.userId,
        tokenHash: newRefreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
        createdAt: new Date(),
        familyId: refreshTokenRecord.familyId,
      },
    }),
  ]);

  const payload = {
    userId,
    role: user.role,
  };

  const newAccessToken = jsonwebtoken.sign(payload, envVariables.JWT_SECRET, {
    expiresIn: "15m",
  });

  return sendSuccess(res, 200, "Refresh token generated", {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
};

export const logout = async (req: Request, res: Response) => {
  const result = logoutSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Validation failed", 400, z.treeifyError(result.error));
  }

  const { refreshToken } = result.data;

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const refreshTokenRecord = await prisma.refreshToken.findUnique({
    where: {
      tokenHash: refreshTokenHash,
    },
  });

  if (!refreshTokenRecord) {
    throw new AppError("Refresh token not valid", 401);
  }

  if (refreshTokenRecord.revokedAt) {
    return sendSuccess(res, 200, "User logged out successfully", null);
  }

  // update() doesn't return null when the record isn't found; it throws an error
  await prisma.refreshToken.update({
    where: {
      id: refreshTokenRecord.id,
    },
    data: {
      revokedAt: new Date(),
      revokedReason: RevokedReason.LOGOUT,
    },
  });

  return sendSuccess(res, 200, "User logged out successfully", null);
};
