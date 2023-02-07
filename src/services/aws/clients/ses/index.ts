import { SESClient, SESClientConfig } from '@aws-sdk/client-ses';
import { AWS_REGION } from 'constant';

const region = AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const config: SESClientConfig = {
  region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};

const client = new SESClient(config);

export default client;
