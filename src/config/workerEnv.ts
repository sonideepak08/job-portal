import "dotenv/config";
import { z } from "zod";

const workerEnvSchema = z.object({
  REDIS_URL: z.string().nonempty(),
  AWS_REGION: z.string().nonempty(),
  SES_FROM_EMAIL: z.email(),
});

export const workerEnvVariables = workerEnvSchema.parse(process.env);
