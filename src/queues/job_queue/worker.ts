import { Worker } from 'bullmq';
import { config } from 'constant';
import redisClient from 'redis/client';
import { expireRequest } from './processors/expireRequests';
import { requestReminder } from './processors/requestReminder';

const redis = redisClient;
const callStatusProcessor = `${config.APP_ROOT}/queues/job_queue/processors/callDuration`;
const mailProcessor = `${config.APP_ROOT}/queues/job_queue/processors/mailTransport`;

export function initializeRequestExpiration() {
    new Worker(config.REQUEST_EXPIRATION_QUEUE_NAME, expireRequest, {
        connection: redis,
        sharedConnection: true,
        concurrency: config.BULL_QUEUE_CONCURRENCY,
    });
}

export function initializeCallStatusWorker() {
    new Worker(config.CALL_QUEUE_NAME, callStatusProcessor, {
        connection: redis,
        sharedConnection: true,
        concurrency: config.BULL_QUEUE_CONCURRENCY,
    });
}

export function initializeEmailWorker() {
    new Worker(config.MAIL_QUEUE_NAME, mailProcessor, {
        connection: redis,
        sharedConnection: true,
        concurrency: config.BULL_QUEUE_CONCURRENCY,
    });
}
export function initializeRequestReminderWorker() {
    new Worker(config.REQUEST_REMINDER_QUEUE_NAME, requestReminder, {
        connection: redis,
        sharedConnection: true,
        concurrency: config.BULL_QUEUE_CONCURRENCY,
    });
}
