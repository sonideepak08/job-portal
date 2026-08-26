import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  company: z.string().trim().min(1),
  location: z.string().trim().min(1),
  experience: z.number().int().min(0),
  skills: z.string().trim().min(1),
});

export const updateJobSchema = createJobSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });
