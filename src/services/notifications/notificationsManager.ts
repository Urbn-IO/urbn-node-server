import { AndroidConfig, ApnsConfig, Notification } from "firebase-admin/messaging";
import { NotificationPriority, NotificationsPayload, NotificationsPayloadTest } from "../../types";
import { propagateMessage } from "./firebaseCloudMessaging";

const sendMessage = () => {
  return {
    sendInstantMessage: ({ messageTitle, messageBody, tokens, data, priority }: NotificationsPayload) => {
      const priorityProp: { android: "normal" | "high"; apns: string } = { android: "normal", apns: "5" };
      if (priority === NotificationPriority.HIGH) {
        priorityProp.android = "high";
        priorityProp.apns = "10";
      }
      const notification: Notification = {
        title: messageTitle,
        body: messageBody,
      };
      const android: AndroidConfig = {
        priority: priorityProp.android,
      };
      const apns: ApnsConfig = {
        headers: {
          "apns-priority": priorityProp.apns,
        },
      };
      propagateMessage(tokens, notification, data, android, apns);
    },
  };
};

const sendTestMessage = () => {
  return {
    sendInstantTestMessage: ({ messageTitle, messageBody, tokens, data, priority }: NotificationsPayloadTest) => {
      const priorityProp: { android: "normal" | "high"; apns: string } = { android: "high", apns: "10" };
      if (priority === NotificationPriority.HIGH) {
        priorityProp.android = "high";
        priorityProp.apns = "10";
      }
      const notification: Notification = {
        title: messageTitle,
        body: messageBody,
      };
      const android: AndroidConfig = {
        priority: priorityProp.android,
      };
      const apns: ApnsConfig = {
        headers: {
          "apns-priority": priorityProp.apns,
        },
      };
      propagateMessage(tokens, notification, data, android, apns);
    },
  };
};

const calls = () => {
  return {
    sendCallNotification: ({ data, tokens }: NotificationsPayload) => {
      // const apns: ApnsConfig = {
      //   headers: {
      //     "apns-priority": "10",
      //     "apns-push-type": "voip",
      //     "apns-topic": `${process.env.APP_BUNDLE_NAME}.voip`,
      //     "apns-expiration": "0",
      //   },
      // };
      const android: AndroidConfig = {
        priority: "high",
        ttl: 0,
      };
      propagateMessage(tokens, undefined, data, android);
    },
  };
};

//  function sendScheduledMessage(message: NotificationsPayload) {
//   return { message };
// }

export function notificationsManager() {
  return {
    ...sendMessage(),
    ...calls(),
    ...sendTestMessage(),
  };
}
