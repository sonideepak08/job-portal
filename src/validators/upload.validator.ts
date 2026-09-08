import { z } from "zod";

export const uploadResumeSchema = z.object({
  fileName: z.string().trim().nonempty().endsWith(".pdf"),
  contentType: z.literal("application/pdf"),
});
