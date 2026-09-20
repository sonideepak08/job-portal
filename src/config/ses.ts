import { SESv2Client } from "@aws-sdk/client-sesv2";
import { workerEnvVariables } from "./workerEnv.ts";

export const sesClient = new SESv2Client({
  region: workerEnvVariables.AWS_REGION,
});
