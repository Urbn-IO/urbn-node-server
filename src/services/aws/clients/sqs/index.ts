import { SQSClient, SQSClientConfig } from '@aws-sdk/client-sqs';
import { AWS_REGION } from '../../../../constants';

const awsRegion = AWS_REGION;
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
