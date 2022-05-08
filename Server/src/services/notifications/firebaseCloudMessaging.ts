import { getMessaging } from "firebase-admin/messaging";
import { NotificationsPayload } from "../../types";

export const propagateMessage = async ({
  messageTitle,
  messageBody,
  tokens,
}: NotificationsPayload) => {
  const registrationTokens = tokens;
  const message = {
    notification: {
      title: messageTitle,
      body: messageBody,
    },
    tokens: registrationTokens,
  };

  await getMessaging()
    .sendMulticast(message)
    .then((response) => {
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(registrationTokens[idx]);
          }
        });
        console.log("List of tokens that caused failures: " + failedTokens);
      }
    });
};
