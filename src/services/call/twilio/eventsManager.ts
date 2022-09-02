import publish from "../../../utils/publish";
import redisClient from "../../../redis/client";
import { addJob, callStatusQueue, destroyRepeatableJob } from "../../../queues/job_queue/producer";
import {
  CachedCallEventPayload,
  CallTimerOptions,
  RequestStatus,
  SubscriptionTopics,
  UpdateCallDurationArgs,
} from "../../../types";
import { VideoCallEvent } from "../../../utils/graphqlTypes";
import { callDuration } from "../../../utils/helpers";
import { RepeatOptions } from "bullmq";
import { changeRequestState } from "../../../request/manage";
import { endVideoCallRoom } from "../calls";
import { logCallSession } from "../../../logging/call";

const redis = redisClient;

const timeOperator = async (options: CallTimerOptions) => {
  //if start, start timer by storing the current time into redis
  if (options.start && options.payload) {
    const { payload } = options;
    payload.startTime = new Date();
    //queue for processing call duration updates to clients after a certain interval
    const limit = payload.callLength / 30 + 1;

    // const queueString = JSON.stringify(queue);
    /// payload.queue = queueString;
    await redis.set(payload.roomSid, JSON.stringify(payload));

    const repeat: RepeatOptions = {
      every: 30000,
      limit,
      immediately: true,
    };

    const data: UpdateCallDurationArgs = { roomSid: payload.roomSid };
    await addJob(callStatusQueue, "call-status", data, {
      repeat,
      jobId: payload.roomSid,
      removeOnComplete: true,
      removeOnFail: true,
    });

    const duration = callDuration(payload.callLength, payload.startTime, payload.startTime);

    return {
      countDown: duration,
      participantA: undefined,
      participantB: undefined,
      requestId: payload.requestId,
      callLength: payload.callLength,
    };
  }

  //get current call duration by getting the stored time from redis and calculating the difference between it and the current time
  const { event } = options;
  if (event) {
    const cachedEvent = await redis.get(event.RoomSid);
    if (!cachedEvent) {
      return {
        duration: 0,
        participantA: undefined,
        participantB: undefined,
        requestId: undefined,
        callLength: undefined,
      };
    }
    const payload: CachedCallEventPayload = JSON.parse(cachedEvent);
    const startTimeRaw = payload.startTime;
    if (!startTimeRaw)
      return {
        duration: 0,
        participantA: undefined,
        participantB: undefined,
        requestId: undefined,
        callLength: undefined,
      };
    const startTimestring = startTimeRaw as unknown as string;
    const startTime = new Date(startTimestring);
    const currentTime = new Date();
    const duration = callDuration(payload.callLength, startTime, currentTime);
    console.log("call duration updated!");
    const participantA = payload.participantA;
    const participantB = payload.participantB;
    return { duration, participantA, participantB, requestId: payload.requestId, callLength: payload.callLength };
  }

  return { duration: 0, participantA: undefined, participantB: undefined, requestId: undefined, callLength: undefined };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const checkParticipant = async (event: VideoCallEvent) => {
  try {
    const cachedEvent = await redis.get(event.RoomSid);
    //if room exists in redis with a participant
    if (cachedEvent) {
      const payload: CachedCallEventPayload = JSON.parse(cachedEvent);
      //if current event participant hasn't been cached, means its a new participant, start timer
      if (event.ParticipantIdentity !== payload.participantA) {
        const participant = event.ParticipantIdentity as string;
        payload.participantB = participant;
        const changedState = await changeRequestState(payload.requestId, RequestStatus.PROCESSING);
        if (changedState) {
          const time = await timeOperator({ start: true, payload });
          event.CallDuration = time.countDown;
          event.participantB = participant;
          console.log("both participants joined");
          return event;
        }
        await endVideoCallRoom(event.RoomSid);
      }
      //in the edge case the same participant gets a connected event twice, just emit event
      return event;
    }
    //create participant in redis with room name
    const participant = event.ParticipantIdentity as string;
    const roomName = event.RoomName;
    //extract the requestId and call length from room name
    const first = roomName.indexOf("/");
    const last = roomName.lastIndexOf("/");
    const requestId = parseInt(roomName.substring(first + 1, last));
    const n = roomName.lastIndexOf(":");
    const callLength = parseInt(roomName.substring(n + 1));

    // const regexCallLength = event.RoomName.match(/:::([\s\S]*)$/);

    const payload: CachedCallEventPayload = {
      requestId,
      roomSid: event.RoomSid,
      roomName: event.RoomName,
      roomStatus: event.RoomStatus,
      participantA: participant,
      participantB: undefined,
      callLength,
      startTime: undefined,
    };
    redis.set(payload.roomSid, JSON.stringify(payload));
    console.log("first participant joined");
    event.CallDuration = 0;
    event.participantA = participant;
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
    },
  };
};

const processCallEvent = () => {
  return {
    processCall: async (event: VideoCallEvent) => {
      console.log(`procesing call event with statusCallBack: ${event.StatusCallbackEvent}`);
      if (event.StatusCallbackEvent === "participant-connected") {
        const storedEvent = await checkParticipant(event);
        return storedEvent;
      }
      if (event.StatusCallbackEvent === "participant-disconnected") {
        const time = await timeOperator({ event });
        event.CallDuration = time.countDown;
        event.participantA = time.participantA;
        event.participantB = time.participantB;
        return event;
      }
      if (event.StatusCallbackEvent === "room-ended") {
        const operator = await timeOperator({ event });
        const requestId = operator.requestId;
        if (!requestId) return;
        const elapsedDuration = operator.countDown;
        const participantA = operator.participantA as string;
        const participantB = operator.participantB;
        const callDuration = operator.callLength;
        event.CallDuration = elapsedDuration;
        event.participantA = participantA;
        event.participantB = participantB;

        await destroyRepeatableJob(callStatusQueue, event.RoomSid);
        await changeRequestState(requestId, RequestStatus.FULFILLED);
        await logCallSession({
          requestId,
          participantA,
          participantB,
          callDuration: callDuration,
          elapsedDuration: elapsedDuration,
        });
        await redis.del(event.RoomSid);

        console.log("call session terminated");
      }
      return null;
    },
  };
};

const eventManager = () => {
  return {
    ...processCallEvent(),
    ...publishEventTodevice(),
  };
};

export default eventManager;
