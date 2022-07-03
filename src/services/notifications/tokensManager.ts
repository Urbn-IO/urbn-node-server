import { addFcmToken, deleteFcmTokens, getFcmTokens } from "./fcmTokenManager";

// export default class TokensManager {
//   addNotificationToken(userId: string, deviceId: string, token: string) {
//     const status = addFcmToken(userId, deviceId, token);
//     return status;
//   }
//   async getNotificationTokens(userIds: string[]) {
//     const result = await getFcmTokens(userIds);
//     return result;
//   }
//   async removeNotificationTokens(userId: string) {
//     await deleteFcmTokens(userId);
//   }
// }

const saveNotificationToken = () => {
  return {
    addNotificationToken: (userId: string, deviceId: string, token: string) => {
      const status = addFcmToken(userId, deviceId, token);
      return status;
    },
  };
};
const retrieveNotificationTokens = () => {
  return {
    getNotificationTokens: async (userIds: string[]) => {
      const result = await getFcmTokens(userIds);
      return result;
    },
  };
};
const deleteNotificationTokens = () => {
  return {
    removeNotificationTokens: async (userId?: string, tokens?: string[]) => {
      await deleteFcmTokens(userId, tokens);
    },
  };
};

const tokensManager = () => {
  return {
    ...saveNotificationToken(),
    ...retrieveNotificationTokens(),
    ...deleteNotificationTokens(),
  };
};

export default tokensManager;
