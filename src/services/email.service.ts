import { envVariables } from "../config/env.ts";
import { sesClient } from "../config/ses.ts";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";

export const sendEmail = async (
  to: string[],
  subject: string,
  body: string,
) => {
  const sendEmailCommand = new SendEmailCommand({
    FromEmailAddress: envVariables.SES_FROM_EMAIL,
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
