import { z } from "zod";
import { JobType } from "../generated/prisma/enums.ts";

export const createJobSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  company: z.string().trim().min(1),
  location: z.string().trim().min(1),
  experience: z.number().int().min(0),
  skills: z
    .array(z.string().trim().min(1))
    .nonempty()
    .refine(
      (skills) => {
        const uniqueSkills = new Set<string>();
        skills.forEach((skill) => uniqueSkills.add(skill.toLowerCase()));
        return skills.length === uniqueSkills.size;
      },
      {
        message: "Skills should not be redundant",
      },
    ),
  jobType: z.enum(JobType),
});

export const updateJobSchema = createJobSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export const jobQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  location: z.string().trim().nonempty().optional(),
  experience: z.coerce.number().int().min(0).optional(),
  skills: z
    .string()
    .trim()
    .nonempty()
    .optional()
    .refine(
      (skills) =>
        skills
          ? skills.split(",").every((skill) => skill.trim().length > 0)
          : true,
      {
        message: "Skill should not be empty",
      },
    ),
  jobType: z.enum(JobType).optional(),
  search: z.string().trim().nonempty().optional(),
});
