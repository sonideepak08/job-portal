import { z } from "zod";

export const applicationStatusParamsSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["APPLIED", "SHORTLISTED", "REJECTED", "HIRED"]),
});
