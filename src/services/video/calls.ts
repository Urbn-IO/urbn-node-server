import crypto from "crypto";
import client from "./twilio/client";
import { jwt } from "twilio";

export const createVideoCallRoom = async (callDurationInSeconds: number) => {
  try {
    console.log("max participant duration: ", callDurationInSeconds);
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
      // maxParticipantDuration: callDurationInSeconds,
    });
    return result.uniqueName;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const getVideoCallToken = (identity: string[], roomName: string) => {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioApiKey = process.env.TWILIO_API_KEY;
  const twilioApiSecret = process.env.TWILIO_API_SECRET;
  const AccessToken = jwt.AccessToken;
  const VideoGrant = AccessToken.VideoGrant;
  // Create Video Grant
  const videoGrant = new VideoGrant({
    room: roomName,
  });

  const tokens = identity.map((x) => {
    const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret, {
      identity: x,
      ttl: 120,
    });
    token.addGrant(videoGrant);
    // Serialize the token to a JWT string and return
    return token.toJwt();
  });

  return tokens;
};
