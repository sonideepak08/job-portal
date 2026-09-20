import { sesClient } from "../config/ses.ts";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import { workerEnvVariables } from "../config/workerEnv.ts";

export const sendEmail = async (
  to: string[],
  subject: string,
  body: string,
) => {
  const sendEmailCommand = new SendEmailCommand({
    FromEmailAddress: workerEnvVariables.SES_FROM_EMAIL,
    Destination: {
      ToAddresses: to,
    },
    Content: {
      Simple: {
        Subject: {
          Data: subject,
        },
        Body: {
          Text: {
            Data: body,
          },
        },
      },
    },
  });

  return sesClient.send(sendEmailCommand);
};
