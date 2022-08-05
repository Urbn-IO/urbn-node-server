import eventManager from "../twilio/eventsManager";
import { CachedCallEventPayload, UpdateCallDurationArgs } from "../../../types";
import { VideoCallEvent } from "../../../utils/graphqlTypes";
import { Job } from "bullmq";
import redisClient from "../../../redis/client";
import { currentCallDuration } from "../../../utils/helpers";
// import { endVideoCallRoom } from "../calls";

//get current call duration by getting the stored time from redis and calculating the difference between it and the current time
const updateClientCallDuration = async ({ roomSid }: UpdateCallDurationArgs) => {
  const redis = redisClient;
  const cachedEvent = await redis.get(roomSid);
  if (!cachedEvent) return;
  const payload: CachedCallEventPayload = JSON.parse(cachedEvent);
  const callLength = payload.callLength;
  const startTimeRaw = payload.startTime;
  if (!startTimeRaw) return;
  const startTimestring = startTimeRaw as unknown as string;
  const startTime = new Date(startTimestring);
  const currentTime = new Date();
  const duration = currentCallDuration(callLength, startTime, currentTime);
  const event: VideoCallEvent = {
    RoomName: payload.roomName,
    RoomSid: payload.roomSid,
    RoomStatus: payload.roomStatus,
    participantA: payload.participantA,
    participantB: payload.participantB,
    CallDuration: duration.countDownDuration,
    StatusCallbackEvent: "",
  };
  console.log("call duration updated from job queue worker");
  eventManager().publishVideoCallEvent(event);
  // if (duration.normalisedDuration >= callLength) await endVideoCallRoom(payload.roomSid);
  return;
};

export default (job: Job<UpdateCallDurationArgs>) => updateClientCallDuration(job.data);
