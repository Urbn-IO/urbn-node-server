import { getMessaging, MulticastMessage } from "firebase-admin/messaging";
import { NotificationsPayload } from "../../types";

export const propagateMessage = async ({
  messageTitle,
  messageBody,
  tokens,
  data,
}: NotificationsPayload) => {
  const message: MulticastMessage = {
    notification: {
      title: messageTitle,
      body: messageBody,
    },
    android: {
      priority: "high",
    },
    apns: {
      headers: {
        "apns-priority": "10",
      },
    },
    data,
    tokens,
  };

  await getMessaging()
    .sendMulticast(message)
    .then((response) => {
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        console.log("List of tokens that caused failures: " + failedTokens);
      }
    });
};
