import { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../utils/AppError.ts";
import { Prisma } from "../generated/prisma/client.ts";
import type { Request, Response } from "express";

interface ErrorResponse {
  success: boolean;
  message: string;
  details?: unknown;
}

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  _next,
) => {
  if (error instanceof AppError) {
    const responseData: ErrorResponse = {
      success: false,
      message: error.message,
    };
    if (error.details !== undefined) {
      responseData.details = error.details;
    }
    return res.status(error.statusCode).json(responseData);
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return res.status(409).json({
      success: false,
      message: "Resource already exists",
    });
  }
  if (error instanceof Error) {
    console.error({
      level: "error",
      message: error.message,
      method: req.method,
      path: req.path,
      stack: error.stack,
    });
  } else {
    console.error({
      level: "error",
      message: String(error),
      method: req.method,
      path: req.path,
    });
  }
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export const routeErrorHandler: RequestHandler = (_req, _res) => {
  throw new AppError("Route not found", 404);
};
