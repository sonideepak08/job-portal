import { bullQueueConnection } from "../config/bullmq.ts";
import { envVariables } from "../config/env.ts";
import { Queue } from "bullmq";

export interface EmailJobData {
  to: string[];
  subject: string;
  body: string;
}

const redisUrl = new URL(envVariables.REDIS_URL);

export const emailQueue = new Queue<EmailJobData>("email", {
  connection: bullQueueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
  },
});
