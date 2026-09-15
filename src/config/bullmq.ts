import { Redis } from "ioredis";
import { envVariables } from "./env.ts";

export const bullQueueConnection = new Redis(envVariables.REDIS_URL);

export const bullWorkerConnection = new Redis(envVariables.REDIS_URL, {
  maxRetriesPerRequest: null,
});
