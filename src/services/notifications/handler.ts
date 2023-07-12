import { sendPushKitNotification } from 'services/apple/notifications/applePushNotifications';
import { NotificationPriority, NotificationRouteCode, NotificationsPayload } from 'types';
import { notificationsManager } from './notificationsManager';
import tokensManager from './tokensManager';

export async function sendInstantNotification(
  userIds: string[],
  messageTitle: string,
  messageBody: string,
  route: NotificationRouteCode = NotificationRouteCode.DEFAULT,
  priority: NotificationPriority = NotificationPriority.NORMAL
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

export async function sendCallNotification(userId: string, reference: string, callerName: string) {
  const tokensObj = await tokensManager().getCallTokens([userId]);
  if (tokensObj.pushkitTokens !== undefined && tokensObj.pushkitTokens.length > 0) {
    sendPushKitNotification(tokensObj.pushkitTokens, reference, callerName);
  } else if (tokensObj.tokens !== undefined && tokensObj.tokens.length > 0) {
    const message: NotificationsPayload = {
      data: {
        reference: reference,
        callerName,
      },
      tokens: tokensObj.tokens,
    };
    notificationsManager().sendCallNotification(message);
  }
}
