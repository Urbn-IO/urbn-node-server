import publish from "../../../utils/publish";
import createWorker from "../../../queues/job_queue/worker";
import redisClient from "../../../redis/client";
import { addJob, createQueue, destroyJob } from "../../../queues/job_queue/producer";
import { CachedCallEventPayload, CallTimerOptions, SubscriptionTopics, UpdateCallDurationArgs } from "../../../types";
import { VideoCallEvent } from "../../../utils/graphqlTypes";
import { currentCallDuration } from "../../../utils/helpers";
import { RepeatOptions } from "bullmq";
import { config } from "../../../constants";

const redis = redisClient;
const callStatusQueue = createQueue("callStatus", redis, false);

const timer = async (options: CallTimerOptions) => {
  //if start, start timer by storing the current time into redis
  if (options.start && options.payload) {
    const { payload } = options;
    payload.startTime = new Date();
    //queue for processing call duration updates to clients after a certain interval

    const queueName = "callStatus";
    const limit = payload.callLength / 30 + 1;
    const queue = callStatusQueue;
    // const queueString = JSON.stringify(queue);
    /// payload.queue = queueString;
    await redis.set(payload.roomSid, JSON.stringify(payload));

    const repeat: RepeatOptions = {
      every: 30000,
      limit,
      immediately: true,
    };

    const data: UpdateCallDurationArgs = { roomSid: payload.roomSid };
    const job = await addJob(queue, payload.roomName, data, {
      repeat,
      jobId: payload.roomSid,
      removeOnComplete: true,
    });

    if (job) {
      const pathToProcessor = `${config.APP_ROOT}/services/video/jobs/updateClientCallDurationJob`;
      const worker = createWorker(queueName, pathToProcessor, redis);
      worker.on("active", (job) => console.log(`job with ${job.id} is active`));
      worker.on("completed", async (job) => console.log(`Completed job ${job.id} successfully`));
      worker.on("failed", (job, err) => console.log(`Failed job ${job.id} with ${err}`));
      worker.on("error", (err) => console.error(err));
    }

    const duration = currentCallDuration(payload.callLength, payload.startTime, payload.startTime);
    const countDown = duration.countDownDuration;

    return { countDown, participantA: undefined, participantB: undefined };
  }

  //get current call duration by getting the stored time from redis and calculating the difference between it and the current time
  const { event } = options;
  if (event) {
    const cachedEvent = await redis.get(event.RoomSid);
    if (!cachedEvent) return { duration: 0, participantA: undefined, participantB: undefined };
    const payload: CachedCallEventPayload = JSON.parse(cachedEvent);
    const startTimeRaw = payload.startTime;
    if (!startTimeRaw) return { duration: 0, participantA: undefined, participantB: undefined };
    const startTimestring = startTimeRaw as unknown as string;
    const startTime = new Date(startTimestring);
    const currentTime = new Date();
    const duration = currentCallDuration(payload.callLength, startTime, currentTime);
    console.log("call duration updated!");
    const participantA = payload.participantA;
    const participantB = payload.participantB;
    return { duration, participantA, participantB };
  }

  return { duration: 0, participantA: undefined, participantB: undefined };
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
        const time = await timer({ start: true, payload });
        event.CallDuration = time.countDown;
        event.participantB = participant;
        console.log("both participants joined");
        return event;
      }
      //in the edge case the same participant gets a connected event twice, just emit event
      return event;
    }
    //create participant in redis with room name
    const participant = event.ParticipantIdentity as string;
    const regexCallLength = event.RoomName.match(/:::([\s\S]*)$/);
    const callLength = regexCallLength ? parseInt(regexCallLength[1]) : 0;
    const payload: CachedCallEventPayload = {
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
        const time = await timer({ event });
        event.CallDuration = time.countDown;
        event.participantA = time.participantA;
        event.participantB = time.participantB;
        return event;
      }
      if (event.StatusCallbackEvent === "room-ended") {
        const time = await timer({ event });
        event.CallDuration = time.countDown;
        event.participantA = time.participantA;
        event.participantB = time.participantB;

        /// change room status to completed (to end room)
        // await endVideoCallRoom(event.RoomSid);
        // const cachedEvent = await redis.get(event.RoomSid);
        // if (cachedEvent) {
        //   const payload: CachedCallEventPayload = JSON.parse(cachedEvent);
        //   if (payload.queue) queue = JSON.parse(payload.queue) as Queue<any, any, string>;
        // }
        // if (queue)
        await destroyJob(callStatusQueue, event.RoomSid, true);

        await redis.del(event.RoomSid);

        console.log("deleted queue and deleted room data from redis and closed connection");
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
