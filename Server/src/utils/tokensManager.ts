import { addFcmToken, deleteFcmTokens, getFcmTokens } from "./fcmTokenManager";

export default class TokensManager {
  addToken(userId: string, deviceId: string, token: string) {
    const status = addFcmToken(userId, deviceId, token);
    return status;
  }
  getTokens(userId: string) {
    const result = getFcmTokens(userId);
    return result;
  }
  removeTokens(userId: string, deviceId: string) {
    deleteFcmTokens(userId, deviceId);
  }
}
