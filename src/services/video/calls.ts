import crypto from "crypto";
import client from "./twilio/client";
import { jwt } from "twilio";
import { storeRoomName } from "./videoRoomManager";

export const createVideoCallRoom = async (callDurationInSeconds: number) => {
  try {
    const currentTime = new Date().valueOf().toString();
    const randomNumber = Math.random().toString();
    const serial = crypto
      .createHash("md5")
      .update(currentTime + randomNumber)
      .digest("hex");
    const roomName = `urbn_video_room:${serial}`;
    const result = await client.video.rooms.create({
      uniqueName: roomName,
      type: "go",
      statusCallbackMethod: "POST",
      statusCallback: "",
      emptyRoomTimeout: 1,
      unusedRoomTimeout: 1,
      maxParticipantDuration: callDurationInSeconds,
    });
    return result.uniqueName;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const getVideoCallToken = (requestId: number, identity: string, roomName: string) => {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioApiKey = process.env.TWILIO_API_KEY;
  const twilioApiSecret = process.env.TWILIO_API_SECRET;
  const AccessToken = jwt.AccessToken;
  const VideoGrant = AccessToken.VideoGrant;
  // Create Video Grant
  const videoGrant = new VideoGrant({
    room: roomName,
  });
  const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret, {
    identity,
    ttl: 120,
  });
  token.addGrant(videoGrant);
  // Serialize the token to a JWT string
  const callToken = token.toJwt();
  storeRoomName(requestId, roomName);
  return callToken;
};
