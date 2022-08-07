import { SQSClientConfig, SQSClient } from "@aws-sdk/client-sqs";

const region = process.env.AWS_SECONDARY_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const config: SQSClientConfig = {
  region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};

const client = new SQSClient(config);
export default client;
