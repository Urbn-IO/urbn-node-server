import eventManager from '../../../services/call/twilio/eventsManager';
import { CachedCallEventPayload, UpdateCallDurationArgs } from '../../../types';
import { VideoCallEvent } from '../../../utils/graphqlTypes';
import { Job } from 'bullmq';
import redisClient from '../../../redis/client';
import { callDuration } from '../../../utils/helpers';
import { endVideoCallRoom } from '../../../services/call/calls';

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
  console.log('call duration updated from job queue worker');
  eventManager().publishVideoCallEvent(event);
  if (duration <= 0) await endVideoCallRoom(payload.roomSid);
  return;
};

export default async (job: Job<UpdateCallDurationArgs>) => await updateClientCallDuration(job.data);
