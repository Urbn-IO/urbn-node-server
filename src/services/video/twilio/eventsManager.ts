import IORedis from "ioredis";
import { addJob, createQueue } from "../../../jobs/producer";
import updateClientCallDuration from "../../../jobs/updateClientCallDurationJob";
import executeJob from "../../../jobs/worker";

import { CachedCallEventPayload, CallTimerOptions, SubscriptionTopics } from "../../../types";
import { VideoCallEvent } from "../../../utils/graphqlTypes";
import publish from "../../../utils/publish";

const timer = async (options: CallTimerOptions, redis: IORedis.Redis) => {
  //if start, start timer by storing the current time into redis
  if (options.start && options.payload) {
    const { payload } = options;
    payload.time = new Date();
    await redis.set(payload.roomSid, JSON.stringify(payload));
    //queue for processing call duration updates to clients after a certain interval
    const queueName = `callStatus:${payload.roomSid}`;
    const queue = createQueue(queueName, redis);
    const job = await addJob(queue, payload.roomName, payload.roomSid, updateClientCallDuration, {
      repeat: {
        every: 30000,
        limit: 6,
      },
    });
    if (job) {
      executeJob(queueName, redis);
    }
    return 1;
  }

  //get current call duration by getting the stored time from redis and calculating the difference between it and the current time
  const { event } = options;
  if (event) {
    const cachedEvent = await redis.get(event.RoomSid);
    if (!cachedEvent) return 0;
    const payload: CachedCallEventPayload = JSON.parse(cachedEvent);
    if (!payload.time) return 0;
    const date = new Date();
    const duration = (date.getTime() - payload.time.getTime()) / 1000;
    payload.time = date;
    await redis.set(payload.roomSid, JSON.stringify(payload));
    console.log("call duration updated");
    return duration;
  }

  return 0;
};
const checkParticipant = async (event: VideoCallEvent, redis: IORedis.Redis) => {
  try {
    const cachedEvent = await redis.get(event.RoomSid);
    //if room exists in redis with a participant
    if (cachedEvent) {
      const payload: CachedCallEventPayload = JSON.parse(cachedEvent);
      //if current event participant hasn't been cached, means its a new participant, start timer
      if (event.ParticipantIdentity !== payload.participantA) {
        payload.participantB = event.ParticipantIdentity;
        const duration = await timer({ start: true, payload }, redis);
        event.CallDuration = duration;
        console.log("both participants joined");
        return event;
      }
      //in the edge case the same participant gets a connected event twice, just emit event
      return event;
    }
    //create participant in redis with room name
    const payload: CachedCallEventPayload = {
      roomSid: event.RoomSid,
      roomName: event.RoomName,
      roomStatus: event.RoomStatus,
      participantA: event.ParticipantIdentity as string,
      participantB: undefined,
      time: undefined,
    };
    redis.set(payload.roomSid, JSON.stringify(payload));
    console.log("first participant joined");
    event.CallDuration = 0;
    return event;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const publishEventTodevice = () => {
  return {
    publishVideoCallEvent: (event: VideoCallEvent) => {
      publish<VideoCallEvent>(SubscriptionTopics.CALL_STATUS, event);
      return true;
    },
  };
};

const processCallEvent = (redis: IORedis.Redis) => {
  return {
    processCall: async (event: VideoCallEvent) => {
      console.log(`procesing call event with statusCallBack: ${event.StatusCallbackEvent}`);
      if (event.StatusCallbackEvent === "participant-connected") {
        const storedEvent = await checkParticipant(event, redis);
        return storedEvent;
      }
      if (event.StatusCallbackEvent === "participant-disconnected") {
        const duration = await timer({ event }, redis);
        event.CallDuration = duration;
        return event;
      }
      if (event.StatusCallbackEvent === "room-ended") {
        // change room status to completed (to end room)

        const duration = await timer({ event }, redis);
        event.CallDuration = duration;
        return event;
      }
      return null;
    },
  };
};

const eventManager = (redis: IORedis.Redis) => {
  return {
    ...processCallEvent(redis),
    ...publishEventTodevice(),
  };
};

export default eventManager;
