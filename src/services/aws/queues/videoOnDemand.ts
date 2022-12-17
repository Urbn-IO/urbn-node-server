import { Consumer, ConsumerOptions } from 'sqs-consumer-v3';
import { ContentType, VideoOutput } from '../../../types';
import { sqsClient } from '../clients/sqs/client';
import saveShoutout from '../../../lib/shoutout/saveShoutout';
import saveVideoBanner from '../../../lib/banner/saveBanner';

const queueUrl = process.env.AWS_SQS_VOD_QUEUE_URL;

const consumerOptions: ConsumerOptions = {
  queueUrl,
  batchSize: 10,
  waitTimeSeconds: 20,
  visibilityTimeout: 120,
  pollingWaitTimeMs: 120000,
  sqs: sqsClient,
  handleMessageBatch: async (messages) => {
    const payload = messages.map((x) => {
      const body = JSON.parse(x.Body as string);
      const mediaInfo = JSON.parse(body.srcMediainfo);
      const durationInSeconds = mediaInfo.container.duration;
      const data: any = {
        durationInSeconds,
        workFlowId: body.guid,
        hlsUrl: body.hlsUrl,
        thumbnailUrl: body.thumbNailsUrls[0],
        lowResPlaceholderUrl: body.lowResPlaceholderUrl,
        srcVideo: body.srcVideo,
        datePublished: body.endTime,
        userId: body.customMetadata.userId,
        owner: body.customMetadata.owner,
        alias: body.customMetadata.alias,
        requestId: body.customMetadata.requestId,
        contentType: body.customMetadata.contentType,
      };

      if (body.mp4Urls) data.mp4Url = body.mp4Urls[0];
      return data;
    });
    const banners: VideoOutput[] = payload.filter((x) => x.contentType === ContentType.BANNER);
    const shoutouts: VideoOutput[] = payload.filter((x) => x.contentType === ContentType.SHOUTOUT);
    if (banners.length > 0) await saveVideoBanner(banners);
    if (shoutouts.length > 0) await saveShoutout(shoutouts);
  },
};

const sqsVODConsumer = Consumer.create(consumerOptions);

sqsVODConsumer.on('error', (err) => {
  console.error(err.message);
});

sqsVODConsumer.on('processing_error', (err) => {
  console.error(err.message);
});

sqsVODConsumer.on('timeout_error', (err) => {
  console.error(err.message);
});

export default sqsVODConsumer;
