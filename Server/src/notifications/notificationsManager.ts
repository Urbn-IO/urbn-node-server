import { FcmTokens } from "../entities/FcmTokens";
import { User } from "../entities/User";
import { firebaseCM } from "./firebaseCM";

export class NotificationsManager {
  async sendNotifications(
    receiverId: string,
    senderId: string,
    requestType: string,
    scheduledNotification: boolean,
    celebAlias = ""
  ) {
    const tokenObj = await FcmTokens.find({ where: { userId: receiverId } });
    const tokens: string[] = [];
    tokenObj.forEach((x) => {
      tokens.push(x.token);
    });
    if (!tokens) {
      return "notification tokens not found for user";
    }
    if (!scheduledNotification) {
      const user = await User.findOne({ where: { userId: senderId } });
      const firstName = user?.firstName;
      if (!firstName) {
        return "An error occured while attempting to send notifications";
      }
      const messageTitle = `You've received a new ${requestType} request!`;
      const messageBody = `Your fan ${firstName}, has sent you a ${requestType} request. Check it out!`;
      firebaseCM(messageTitle, messageBody, tokens);
    } else {
      const messageTitle = `Reminder! You have requests expiring in 3 days, check them out!`;
      const messageBody = `Your have requests that will expire in 3 days time, Click to check them out`;
      firebaseCM(messageTitle, messageBody, tokens);
    }
    return `${requestType} request sent to ${celebAlias}`;
  }
}
