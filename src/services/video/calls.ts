// import crypto from "crypto";
// import { Twilio } from "twilio";
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;

// const client = new Twilio(accountSid, authToken);

// export const createRoom = async () => {
//   const roomName = crypto.createHash("md5").digest("hex");
//   const room = await client.video.rooms.create({
//     uniqueName: roomName,
//     type: "go",
//     enableTurn: true,

//   });
// };
