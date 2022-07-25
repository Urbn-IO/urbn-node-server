import IORedis from "ioredis";
import eventManager from "../services/video/twilio/eventsManager";
import { CachedCallEventPayload } from "../types";
import { VideoCallEvent } from "../utils/graphqlTypes";

const updateClientCallDuration = async (roomSid: string, redis: IORedis.Redis) => {
  console.log("updating client call duration!");
  const cachedEvent = await redis.get(roomSid);
  if (!cachedEvent) return;
  const payload: CachedCallEventPayload = JSON.parse(cachedEvent);
  if (!payload.time) return;
  const date = new Date();
  const duration = (date.getTime() - payload.time.getTime()) / 1000;
  payload.time = date;
  await redis.set(payload.roomSid, JSON.stringify(payload));
  const event: VideoCallEvent = {
    RoomName: payload.roomName,
    RoomSid: payload.roomSid,
    RoomStatus: payload.roomStatus,
    CallDuration: duration,
    StatusCallbackEvent: "",
  };
  console.log("call duration updated from job queue worker, waiting for repeat...");
  eventManager(redis).publishVideoCallEvent(event);
  return;
};

export default updateClientCallDuration;
