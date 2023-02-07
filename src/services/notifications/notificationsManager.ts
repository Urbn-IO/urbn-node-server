import { AndroidConfig, ApnsConfig, Notification } from 'firebase-admin/messaging';
import { NotificationPriority, NotificationsPayload } from 'types';
import { propagateMessage } from './firebaseCloudMessaging';

const sendMessage = () => {
  return {
    sendInstantMessage: ({ messageTitle, messageBody, tokens, data, priority }: NotificationsPayload) => {
      const priorityProp: {
        android: 'normal' | 'high';
        apns: '5' | '10';
      } = {
        android: 'normal',
        apns: '5',
      };
      if (priority === NotificationPriority.HIGH) {
        priorityProp.android = 'high';
        priorityProp.apns = '10';
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
          'apns-priority': priorityProp.apns,
        },
      };
      propagateMessage(tokens, notification, data, android, apns);
    },
  };
};

const calls = () => {
  return {
    sendCallNotification: ({ data, tokens }: NotificationsPayload) => {
      const android: AndroidConfig = {
        priority: 'high',
        ttl: 0,
      };
      propagateMessage(tokens, undefined, data, android);
    },
  };
};

export function notificationsManager() {
  return {
    ...sendMessage(),
    ...calls(),
  };
}
