import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import { envVariables } from "./env.ts";

const adapter = new PrismaPg({
  connectionString: envVariables.DATABASE_URL,
});

export const prisma = new PrismaClient({
  adapter,
});
