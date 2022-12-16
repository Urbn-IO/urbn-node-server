import { Worker } from 'bullmq';
import { config } from '../../constants';
import redisClient from '../../redis/client';

const redis = redisClient;
const callStatusProcessor = `${config.APP_ROOT}/queues/job_queue/processors/callDuration`;
const mailProcessor = `${config.APP_ROOT}/queues/job_queue/processors/mailTransport`;
const requestOperatorProcessor = `${config.APP_ROOT}/queues/job_queue/processors/requestOperator`;

export const callStatusWorker = new Worker(config.CALL_QUEUE_NAME, callStatusProcessor, {
  connection: redis,
  sharedConnection: true,
  concurrency: config.BULL_QUEUE_CONCURRENCY,
});
export const mailWorker = new Worker(config.MAIL_QUEUE_NAME, mailProcessor, {
  connection: redis,
  sharedConnection: true,
  concurrency: config.BULL_QUEUE_CONCURRENCY,
});
export const operationsWorker = new Worker(config.OPERATIONS_QUEUE_NAME, requestOperatorProcessor, {
  connection: redis,
  sharedConnection: true,
  concurrency: config.BULL_QUEUE_CONCURRENCY,
});
