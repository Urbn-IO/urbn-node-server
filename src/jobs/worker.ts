import { Worker } from "bullmq";
import IORedis from "ioredis";
import { CallbackFunction } from "../types";

const executeJob = (queuName: string, redis: IORedis.Redis) => {
  new Worker(
    queuName,
    async (job) => {
      console.log("...executing job: ", job.name);
      const id: string = job.data.id;
      const func: CallbackFunction = job.data.callBack;
      func(id, redis);
    },
    { connection: redis }
  );
  console.log("worker started!");
};

export default executeJob;
