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

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export const register = async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.treeifyError(result.error),
    });
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

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.treeifyError(result.error),
    });
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
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

  return res.status(200).json({
    message: "Login successful",
    accessToken,
    refreshToken,
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const result = refreshTokenSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.treeifyError(result.error),
    });
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
    return res.status(401).json({
      message: "Refresh token not valid",
    });
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
    return res.status(401).json({
      message: "Refresh token is revoked",
    });
  }

  const isRefreshTokenExpired =
    refreshTokenRecord.expiresAt.getTime() < Date.now();

  if (isRefreshTokenExpired) {
    return res.status(401).json({
      message: "Refresh token is expired",
    });
  }

  const userId = refreshTokenRecord.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(400).json({
      message: "User not found",
    });
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

  return res.status(200).json({
    message: "Refresh token generated",
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
};

export const logout = async (req: Request, res: Response) => {
  const result = logoutSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.treeifyError(result.error),
    });
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
    return res.status(401).json({
      message: "Refresh token not valid",
    });
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

  return res.status(200).json({
    message: "User logged out successfully",
  });
};
