import { SNSClient, SNSClientConfig } from '@aws-sdk/client-sns';
import { AWS_REGION } from 'constant';

const region = AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const config: SNSClientConfig = {
  region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};

const client = new SNSClient(config);

export default client;
