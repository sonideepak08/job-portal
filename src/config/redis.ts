import { createClient } from "redis";
import { envVariables } from "./env.ts";

export const redisClient = createClient({
  url: envVariables.REDIS_URL,
});

export const connectRedis = async () => {
  await redisClient.connect();
  console.log("Redis connected");
};

redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});
