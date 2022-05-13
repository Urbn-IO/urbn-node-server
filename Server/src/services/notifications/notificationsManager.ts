import { NotificationsPayload } from "../../types";
import { propagateMessage } from "./firebaseCloudMessaging";

function sendMessage(message: NotificationsPayload) {
  return {
    sendInstantMessage: () => {
      propagateMessage(message);
    },
  };
}

//  function sendScheduledMessage(message: NotificationsPayload) {
//   return { message };
// }

export function notificationsManager(message: NotificationsPayload) {
  return {
    ...sendMessage(message),
  };
}
