import type { Request, Response } from "express";
import { uploadResumeSchema } from "../validators/upload.validator.ts";
import { AppError } from "../utils/AppError.ts";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { envVariables } from "../config/env.ts";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/s3.ts";
import { sendSuccess } from "../utils/sendSuccess.ts";
import crypto from "crypto";

export const generateResumeUploadUrl = async (req: Request, res: Response) => {
  const result = uploadResumeSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(
      "Incorrect file details",
      400,
      z.treeifyError(result.error),
    );
  }
  const { contentType } = result.data;

  const user = req.user!;
  const candidateId = user.userId;

  const randomUUID = crypto.randomUUID();

  const key = `resumes/${candidateId}/${randomUUID}.pdf`;

  const command = new PutObjectCommand({
    Bucket: envVariables.S3_RESUME_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300,
  });

  return sendSuccess(res, 200, "Upload URL generated successfully", {
    uploadUrl,
    key,
  });
};
