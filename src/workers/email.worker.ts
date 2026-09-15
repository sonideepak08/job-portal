import { Worker } from "bullmq";
import type { EmailJobData } from "../queues/email.queue.ts";
import { sendEmail } from "../services/email.service.ts";
import { bullWorkerConnection } from "../config/bullmq.ts";

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
  },
  {
    connection: bullWorkerConnection,
  },
);

emailWorker.on("completed", (job) => {
  console.log(
    `Job completed successfully. jobId: ${job.id}, jobName: ${job.name}`,
  );
});
emailWorker.on("failed", (job, error) => {
  if (!job) {
    console.error("Unknown job failed:", error.message);
    return;
  }

  const maxAttempts = job.opts.attempts ?? 1;

  console.error(
    `Job ${job.id} failed. Attempt ${job.attemptsMade}/${maxAttempts}. Error: ${error.message}`,
  );

  if (job.attemptsMade >= maxAttempts) {
    console.error(`Job ${job.id} permanently failed after all attempts.`);
  }
});
