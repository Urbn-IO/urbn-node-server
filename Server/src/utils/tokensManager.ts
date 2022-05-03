import { addFcmToken, getFcmTokens } from "./fcmTokenManager";

export default class TokensManager {
  addToken(userId: string, token: string) {
    const status = addFcmToken(userId, token);
    return status;
  }
  getTokens(userId: string) {
    const result = getFcmTokens(userId);
    return result;
  }
}
