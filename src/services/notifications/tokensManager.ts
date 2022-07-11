import { addFcmToken, deleteFcmTokens, getFcmCallTokens, getFcmTokens } from "./fcmTokenManager";

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
    addNotificationToken: (
      userId: string,
      deviceId: string,
      platform: string,
      notificationToken: string,
      pushKitToken?: string
    ) => {
      const status = addFcmToken(userId, deviceId, platform, notificationToken, pushKitToken);
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
const retrieveCallTokens = () => {
  return {
    getCallTokens: async (userIds: string[]) => {
      const result = await getFcmCallTokens(userIds);
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
    ...retrieveCallTokens(),
  };
};

export default tokensManager;
