import { NotificationPriority, NotificationRouteCode, NotificationsPayload } from "../../types";
import { sendPushKitNotification } from "./applePushNotifications";
import { notificationsManager } from "./notificationsManager";
import tokensManager from "./tokensManager";

export async function sendInstantNotification(
  userIds: string[],
  messageTitle: string,
  messageBody: string,
  route: NotificationRouteCode = NotificationRouteCode.DEFAULT,
  priority: NotificationPriority = NotificationPriority.HIGH
) {
  const tokens = await tokensManager().getNotificationTokens(userIds);
  const message: NotificationsPayload = {
    messageTitle,
    messageBody,
    data: {
      routeCode: route,
    },
    tokens,
    priority,
  };
  notificationsManager().sendInstantMessage(message);
}

export async function sendCallNotification(userId: string, requestId: number, callerName: string) {
  const tokensObj = await tokensManager().getCallTokens([userId]);
  if (tokensObj.pushKitTokens !== undefined && tokensObj.pushKitTokens.length > 0) {
    sendPushKitNotification(tokensObj.pushKitTokens, requestId, callerName);
  }
  if (tokensObj.tokens !== undefined && tokensObj.tokens.length > 0) {
    const message: NotificationsPayload = {
      data: {
        requestId: requestId.toString(),
        callerName,
      },
      tokens: tokensObj.tokens,
    };
    notificationsManager().sendCallNotification(message);
  }
}
