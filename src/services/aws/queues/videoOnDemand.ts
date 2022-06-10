import { Consumer, ConsumerOptions } from "sqs-consumer-v3";
import { saveShoutout } from "../../../shoutout/saveShoutOut";
import { contentType, VideoOutput } from "../../../types";
import client from "../clients/sqsClient";

const queueUrl = process.env.AWS_SQS_VOD_QUEUE_URL;

const consumerOptions: ConsumerOptions = {
  queueUrl,
  batchSize: 10,
  waitTimeSeconds: 20,
  visibilityTimeout: 120,
  pollingWaitTimeMs: 120000,
  sqs: client,
  handleMessageBatch: async (messages) => {
    const payload = messages.map((x) => {
      const body = JSON.parse(x.Body as string);
      const mediaInfo = JSON.parse(body.srcMediainfo);
      const durationInSeconds = mediaInfo.container.duration;
      return {
        durationInSeconds,
        workFlowId: body.guid,
        hlsUrl: body.hlsUrl,
        thumbnailUrl: body.thumbNailsUrls[0],
        mp4Url: body.mp4Urls[0],
        srcVideo: body.srcVideo,
        datePublished: body.endTime,
        userId: body.customMetadata.userId,
        owner: body.customMetadata.owner,
        alias: body.customMetadata.alias,
        requestId: body.customMetadata.requestId,
        contentType: body.customMetadata.contentType,
      };
    });
    const shoutouts: VideoOutput[] = payload.filter(
      (x) => x.contentType === contentType.SHOUTOUT
    );
    if (shoutouts.length > 0) {
      saveShoutout(shoutouts);
    }
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
