import { AndroidConfig, ApnsConfig, MulticastMessage, Notification, TopicMessage } from 'firebase-admin/messaging';
import { NotificationPriority, NotificationsPayload } from 'types';
import { propagateMessageByTokens, propagateMessageByTopic } from './firebaseCloudMessaging';

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

      const message: MulticastMessage = {
        notification,
        android,
        apns,
        data,
        tokens,
      };
      propagateMessageByTokens(message);
    },
    sendInstantMessageToTopic: ({
      messageBody,
      topic,
      imageUrl,
    }: Pick<NotificationsPayload, 'messageBody' | 'imageUrl' | 'topic'>) => {
      const messages: TopicMessage = {
        topic: topic as string,
        notification: {
          title: 'Urbn',
          body: messageBody,
          imageUrl: imageUrl,
        },
        android: { priority: 'normal' },
        apns: { headers: { 'apns-priority': '5' } },
      };

      propagateMessageByTopic(messages);
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
      const message: MulticastMessage = {
        data,
        tokens,
        android,
      };
      propagateMessageByTokens(message);
    },
  };
};

export function notificationsManager() {
  return {
    ...sendMessage(),
    ...calls(),
  };
}
