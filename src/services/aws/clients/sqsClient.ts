import { SQSClientConfig, SQS } from "@aws-sdk/client-sqs";

const region = process.env.AWS_VOD_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const sqsConfig: SQSClientConfig = {
  region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};

const client = new SQS(sqsConfig);
export default client;
