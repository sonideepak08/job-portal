import { z } from "zod";

export const applyToJobSchema = z.object({
  jobId: z.coerce.number().int().positive(),
});
