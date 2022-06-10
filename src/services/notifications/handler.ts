import { notificationRouteCode, NotificationsPayload } from "../../types";
import { notificationsManager } from "./notificationsManager";
import tokensManager from "../../utils/tokensManager";

export async function sendPushNotification(
  userIds: string[],
  messageTitle: string,
  messageBody: string,
  route: notificationRouteCode = notificationRouteCode.DEFAULT
) {
  const tokens = await tokensManager().getNotificationTokens(userIds);
  const message: NotificationsPayload = {
    messageTitle,
    messageBody,
    data: {
      routeCode: route,
    },
    tokens,
  };
  notificationsManager(message).sendInstantMessage();
}
