import { getFcmTokens } from "../../utils/fcmTokenManager";
import { notificationRouteCode, NotificationsPayload } from "../../types";
import { notificationsManager } from "./notificationsManager";

export async function sendPushNotification(
  userId: string[],
  messageTitle: string,
  messageBody: string,
  route: notificationRouteCode = notificationRouteCode.DEFAULT
) {
  const tokens = await getFcmTokens(userId);
  const message: NotificationsPayload = {
    messageTitle,
    messageBody,
    data: {
      routeCode: route,
    },
    tokens,
  };
  const notifications = notificationsManager(message);
  notifications.sendInstantMessage();
}
