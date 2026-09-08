import { S3Client } from "@aws-sdk/client-s3";
import { envVariables } from "./env.ts";

export const s3Client = new S3Client({
  region: envVariables.AWS_REGION,
});
