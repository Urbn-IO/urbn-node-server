import { AndroidConfig, ApnsConfig, getMessaging, MulticastMessage, Notification } from "firebase-admin/messaging";
import tokensManager from "./tokensManager";

export const propagateMessage = async (
  tokens: string[],
  notification?: Notification,
  android?: AndroidConfig,
  apns?: ApnsConfig,
  data?: {
    [key: string]: string;
  }
) => {
  try {
    const message: MulticastMessage = {
      notification,
      android,
      apns,
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
          tokensManager().removeNotificationTokens(undefined, failedTokens);
        }
      });
  } catch (err) {
    console.error("error: ", err);
  }
};
