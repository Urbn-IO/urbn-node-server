import { getMessaging, MulticastMessage, TopicMessage } from 'firebase-admin/messaging';
import tokensManager from './tokensManager';

export const propagateMessageByTokens = async (message: MulticastMessage) => {
  try {
    await getMessaging()
      .sendEachForMulticast(message)
      .then((response) => {
        if (response.failureCount > 0) {
          const failedTokens: string[] = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              console.error('notification error message: ', resp.error);
              failedTokens.push(message.tokens[idx]);
            }
          });
          console.error('List of notification tokens that caused failures: ' + failedTokens);
          tokensManager().removeNotificationTokens(undefined, failedTokens);
        }
      });
  } catch (err) {
    console.error('error: ', err);
  }
};

export const propagateMessageByTopic = async (message: TopicMessage) => {
  await getMessaging()
    .send(message)
    .then((response) => {
      console.log('Successfully sent message:', response);
    })
    .catch((err) => {
      console.log('Error sending message:', err);
    });
};
