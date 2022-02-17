import { genericResponse } from "src/utils/graphqlTypes";
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
  ): Promise<genericResponse> {
    const tokenObj = await FcmTokens.find({ where: { userId: receiverId } });
    const tokens: string[] = [];
    tokenObj.forEach((x) => {
      tokens.push(x.token);
    });
    if (tokens.length === 0) {
      return {
        errors: [
          { errorMessage: "notification tokens not found for user", field: "" },
        ],
      };
    }
    if (!scheduledNotification) {
      const user = await User.findOne({ where: { userId: senderId } });
      const firstName = user?.firstName;
      if (!firstName) {
        return {
          errors: [
            {
              errorMessage:
                "An error occured while attempting to send notifications",
              field: "",
            },
          ],
        };
      }
      const messageTitle = `You've received a new ${requestType} request!`;
      const messageBody = `Your fan ${firstName}, has sent you a ${requestType} request. Check it out!`;
      await firebaseCM(messageTitle, messageBody, tokens);
      return { success: `${requestType} request sent to ${celebAlias}` };
    } else {
      const messageTitle = `Reminder! You have requests expiring in 3 days, check them out!`;
      const messageBody = `Your have requests that will expire in 3 days time, Click to check them out`;
      await firebaseCM(messageTitle, messageBody, tokens);
      return { success: `sent` };
    }
  }
}
