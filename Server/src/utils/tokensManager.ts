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
  async removeTokens(userId: string, deviceId: string) {
    await deleteFcmTokens(userId, deviceId);
  }
}
