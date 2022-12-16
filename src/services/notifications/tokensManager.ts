import { addToken, deleteTokens, getTokens, getServiceCallTokens } from './notificationTokenManager';
import { DeviceInfoInput } from '../../utils/graphqlTypes';

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
    addNotificationToken: (userId: string, device: DeviceInfoInput) => {
      const { id, notificationToken, platform, pushkitToken } = device;
      const status = addToken(userId, id, platform, notificationToken, pushkitToken);
      return status;
    },
  };
};
const retrieveNotificationTokens = () => {
  return {
    getNotificationTokens: async (userIds: string[]) => {
      const result = await getTokens(userIds);
      return result;
    },
  };
};
const retrieveCallTokens = () => {
  return {
    getCallTokens: async (userIds: string[]) => {
      const result = await getServiceCallTokens(userIds);
      return result;
    },
  };
};
const deleteNotificationTokens = () => {
  return {
    removeNotificationTokens: async (userId?: string, tokens?: string[]) => {
      await deleteTokens(userId, tokens);
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
