import { SESv2Client } from "@aws-sdk/client-sesv2";
import { envVariables } from "./env.ts";

export const sesClient = new SESv2Client({
  region: envVariables.AWS_REGION,
});
