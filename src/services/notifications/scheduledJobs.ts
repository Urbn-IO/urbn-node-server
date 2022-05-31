// import { getConnection } from "typeorm";
// // import { NotificationsManager } from "./notificationsManager";

// export const highPriority = async () => {
//   const data = await getConnection()
//     .query(`select r."requestor", r."recepient", r."requestType" from requests r
//    where r."requestExpires" < NOW()`);

//   console.log(data);
//   for (const x in data) {
//     const receiver = data[x].recepient;
//     const sender = data[x].requestor;
//     const requestType = data[x].requestType;

//     const notification = new NotificationsManager();
//     notification.sendNotifications(receiver, sender, requestType, true);
//   }
// };
