import { z } from "zod";

export const applicationIdSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
});

export const resumeMetadataSchema = z.object({
  resumeKey: z.string().trim().nonempty(),
  fileName: z.string().trim().nonempty().endsWith(".pdf"),
  contentType: z.literal("application/pdf"),
  fileSize: z.coerce
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024),
});
