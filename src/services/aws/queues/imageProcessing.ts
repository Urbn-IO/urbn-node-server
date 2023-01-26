import { Consumer, ConsumerOptions } from 'sqs-consumer-v3';
import { AWS_SQS_IMAGE_PROCESSOR_QUEUE_URL } from '../../../constants';
import handler from '../../../lib/imageQueueHandlers/queueHandler';
import { ImageProcessorQueueOutput } from '../../../types';
import { sqsClient } from '../clients/sqs';

const consumerOptions: ConsumerOptions = {
  queueUrl: AWS_SQS_IMAGE_PROCESSOR_QUEUE_URL,
  batchSize: 10,
  waitTimeSeconds: 20,
  visibilityTimeout: 120,
  pollingWaitTimeMs: 0,
  sqs: sqsClient,
  handleMessageBatch: async (messages) => {
    const payload = messages.map((x) => {
      const body: ImageProcessorQueueOutput = JSON.parse(x.Body as string);
      return body;
    });

    handler(payload);
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
