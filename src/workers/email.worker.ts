import { Worker } from "bullmq";
import type { EmailJobData } from "../queues/email.queue.ts";
import { sendEmail } from "../services/email.service.ts";
import { envVariables } from "../config/env.ts";
import { bullWorkerConnection } from "../config/bullmq.ts";

const redisUrl = new URL(envVariables.REDIS_URL);

const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job) => {
    const { to, subject, body } = job.data;
    console.log(
      "Worker started processing",
      "jobId:",
      job.id,
      "jobName:",
      job.name,
    );
    await sendEmail(to, subject, body);
    console.log(
      "Worker completed processing",
      "jobId:",
      job.id,
      "jobName:",
      job.name,
    );
  },
  {
    connection: bullWorkerConnection,
  },
);
