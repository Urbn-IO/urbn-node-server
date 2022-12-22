import { Consumer, ConsumerOptions } from 'sqs-consumer-v3';
import handler from '../../../lib/imageQueueHandlers/queueHandler';
import { ImageProcessorQueueOutput } from '../../../types';
import { sqsClient } from '../clients/sqs/client';

const queueUrl = process.env.AWS_SQS_IMAGE_PROCESSOR_QUEUE_URL;
const consumerOptions: ConsumerOptions = {
  queueUrl,
  batchSize: 10,
  waitTimeSeconds: 20,
  visibilityTimeout: 120,
  pollingWaitTimeMs: 120000,
  sqs: sqsClient,
  handleMessageBatch: async (messages) => {
    const payload = messages.map((x) => {
      const body: ImageProcessorQueueOutput = JSON.parse(x.Body as string);
      return body;
    });

    await handler(payload);
  },
};

const sqsImageConsumer = Consumer.create(consumerOptions);

sqsImageConsumer.on('error', (err) => {
  console.error(err.message);
});

sqsImageConsumer.on('processing_error', (err) => {
  console.error(err.message);
});

sqsImageConsumer.on('timeout_error', (err) => {
  console.error(err.message);
});

export default sqsImageConsumer;
