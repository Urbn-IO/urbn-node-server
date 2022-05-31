import { Consumer, ConsumerOptions } from "sqs-consumer-v3";
import client from "../aws/clients/sqsClient";

const queueUrl = process.env.AWS_SQS_VOD_QUEUE_URL;

const consumerOptions: ConsumerOptions = {
  queueUrl,
  batchSize: 10,
  waitTimeSeconds: 15,
  visibilityTimeout: 120,
  pollingWaitTimeMs: 20,
  sqs: client,
  handleMessageBatch: async (messages) => {
    const metaData = messages.map((x) => {
      const body = JSON.parse(x.Body as string);
      if (body.workflowStatus === "Complete") {
        return {
          workFlowId: body.guid,
          hlsUrl: body.hlsUrl,
          thumbNails: body.thumbNailsUrls,
          endOfProcessTime: body.endTime,
        };
      }
      return {};
    });
    console.log(metaData);
  },
};

const sqsConsumer = Consumer.create(consumerOptions);

sqsConsumer.on("error", (err) => {
  console.error(err.message);
});

sqsConsumer.on("processing_error", (err) => {
  console.error(err.message);
});

sqsConsumer.on("timeout_error", (err) => {
  console.error(err.message);
});

export default sqsConsumer;
