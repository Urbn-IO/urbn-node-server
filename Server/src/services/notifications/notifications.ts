import { NotificationsPayload } from "../../types";
import { propagateMessage } from "./firebaseCloudMessaging";

export function sendMessage(message: NotificationsPayload) {
  return {
    sendInstantMessage: () => {
      propagateMessage(message);
    },
  };
}

export function sendScheduledMessage(message: NotificationsPayload) {
  return { message };
}
