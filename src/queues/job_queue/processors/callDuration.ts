import { Job } from 'bullmq';
import redisClient from 'redis/client';
import eventManager from 'services/twilio/call/eventsManager';
import { endVideoCallRoom } from 'services/twilio/calls';
import { CachedCallEventPayload, UpdateCallDurationArgs } from 'types';
import { VideoCallEvent } from 'utils/graphqlTypes';
import { callDuration } from 'utils/helpers';

const redis = redisClient;

//get current call duration by getting the stored time from redis and calculating the difference between it and the current time
const updateClientCallDuration = async ({ roomSid }: UpdateCallDurationArgs) => {
  const cachedEvent = await redis.get(roomSid);
  if (!cachedEvent) return;
  const payload: CachedCallEventPayload = JSON.parse(cachedEvent);
  const callLength = payload.callLength;
  const startTimeRaw = payload.startTime;
  if (!startTimeRaw) return;
  const startTimestring = startTimeRaw as unknown as string;
  const startTime = new Date(startTimestring);
  const currentTime = new Date();
  const duration = callDuration(callLength, startTime, currentTime);
  const event: VideoCallEvent = {
    RoomName: payload.roomName,
    RoomSid: payload.roomSid,
    RoomStatus: payload.roomStatus,
    participantA: payload.participantA,
    participantB: payload.participantB,
    CallDuration: duration,
    StatusCallbackEvent: '',
  };
  eventManager().publishVideoCallEvent(event);
  if (duration <= 0) await endVideoCallRoom(payload.roomSid);
  return;
};

export default async (job: Job<UpdateCallDurationArgs>) => await updateClientCallDuration(job.data);
