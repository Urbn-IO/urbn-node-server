// import { getFcmTokens } from "../../utils/fcmTokenManager";
// import { User } from "../../entities/User";
// import { propagateMessage } from "./firebaseCloudMessaging";

// export class NotificationsManager {
//   async sendNotifications(
//     receiverId: string,
//     senderId: string,
//     requestType: string,
//     scheduledNotification: boolean,
//     celebAlias = ""
//   ) {
//     const tokenObj = await getFcmTokens(receiverId);
//     const tokens: string[] = [];
//     tokenObj.forEach((x) => {
//       tokens.push(x.token);
//     });
//     console.log(tokens);
//     if (tokens.length === 0) {
//       return { errorMessage: "notification tokens not found for user" };
//     }
//     if (!scheduledNotification) {
//       const user = await User.findOne({ where: { userId: senderId } });
//       const firstName = user?.firstName;
//       if (!firstName) {
//         return {
//           errorMessage:
//             "An error occured while attempting to send notifications",
//         };
//       }
//       if (requestType !== "shoutout") {
//         requestType = "video call";
//       }
//       const messageTitle = `You've received a new ${requestType} request!`;
//       const messageBody = `Your fan ${firstName}, has sent you a ${requestType} request. Check it out!`;
//       propagateMessage(messageTitle, messageBody, tokens);
//       return { success: `${requestType} request sent to ${celebAlias}` };
//     } else {
//       const messageTitle = `Reminder! You have requests expiring in 3 days, check them out!`;
//       const messageBody = `Your have requests that will expire in 3 days time, Click to check them out`;
//       propagateMessage(messageTitle, messageBody, tokens);
//       return { success: `sent` };
//     }
//   }
// }
