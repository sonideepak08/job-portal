import { Redis } from "ioredis";
import { workerEnvVariables } from "./workerEnv.ts";

export const bullQueueConnection = new Redis(workerEnvVariables.REDIS_URL);

export const bullWorkerConnection = new Redis(workerEnvVariables.REDIS_URL, {
  maxRetriesPerRequest: null,
});
