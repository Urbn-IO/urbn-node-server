import { SQSClientConfig, SQSClient } from '@aws-sdk/client-sqs';

const awsRegion = process.env.AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const sqsClientConfig: SQSClientConfig = {
  region: awsRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};

export const sqsClient = new SQSClient(sqsClientConfig);
