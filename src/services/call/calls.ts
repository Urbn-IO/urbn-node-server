import crypto from 'crypto';
import client from './twilio/client';
import { jwt } from 'twilio';
import { VIDE_CALL_PREFIX } from '../../constants';

export const createVideoCallRoom = async (requestId: number, callDurationInSeconds: string) => {
  try {
    const currentTime = new Date().valueOf().toString();
    const randomNumber = Math.random().toString();
    const id = requestId.toString();
    const serial = crypto
      .createHash('sha1')
      .update(currentTime + randomNumber)
      .digest('hex');

    //Do not change the string format of the room name. If it must be changed, change how the requestId and call duration are retrieved from the webhook handler for calls
    const roomName = `${VIDE_CALL_PREFIX}${serial}/${id}/:::${callDurationInSeconds}`;
    const result = await client.video.rooms.create({
      uniqueName: roomName,
      type: 'go',
      statusCallbackMethod: 'POST',
      statusCallback: process.env.TWILIO_WEBHOOK,
      emptyRoomTimeout: 1,
      unusedRoomTimeout: 1,
    });
    return result.uniqueName;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const endVideoCallRoom = async (roomSid: string) => {
  const room = await client.video.rooms(roomSid).update({ status: 'completed' });
  const status = room.status;
  const duration = room.duration;
  console.log(`room ${roomSid} ${status} in ${duration}`);
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
