import { FcmTokens } from "../entities/FcmTokens";
import { User } from "../entities/User";
import { firebaseCM } from "./firebaseCM";

export class notificationsManager {
  async sendNotifications(
    receiverId: string,
    senderId: string,
    requestType: string
  ) {
    const user = await User.findOne({ where: { userId: senderId } });
    const firstName = user?.firstName;
    if (!firstName) {
      return "An error occured while attempting to send notifications";
    }
    const tokenObj = await FcmTokens.find({ where: { userId: receiverId } });
    const tokens: string[] = [];
    tokenObj.forEach((x) => {
      tokens.push(x.token);
    });
    const messageTitle = `You've received a new ${requestType} request!`;
    const messageBody = `Your fan ${firstName}, has sent you a ${requestType} request. Check it out!`;
    firebaseCM(messageTitle, messageBody, tokens);

    return `${requestType} request sent to celebrity`;
  }
}
