import { NotificationPriority, NotificationRouteCode, NotificationsPayload } from "../../types";
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
  const tokens = await tokensManager().getCallTokens([userId]);
  const message: NotificationsPayload = {
    data: {
      requestId: requestId.toString(),
      callerName,
    },
    tokens,
  };
  notificationsManager().sendCallNotification(message);
}
