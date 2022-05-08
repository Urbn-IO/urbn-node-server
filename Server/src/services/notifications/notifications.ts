import { NotificationsPayload } from "../../types";
import { propagateMessage } from "./firebaseCloudMessaging";

function sendMessage(message: NotificationsPayload) {
  return {
    sendInstantMessage: () => {
      propagateMessage(message);
    },
  };
}

function sendScheduledMessage(message: NotificationsPayload) {
  return {};
}
