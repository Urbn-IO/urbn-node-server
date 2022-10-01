import { SQSClientConfig, SQSClient } from "@aws-sdk/client-sqs";

const awsRegion1 = process.env.AWS_REGION_1;
const awsRegion2 = process.env.AWS_REGION_2;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const sqsClient1Config: SQSClientConfig = {
  region: awsRegion1,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};
const sqsClient2Config: SQSClientConfig = {
  region: awsRegion2,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};

export const sqsClient1 = new SQSClient(sqsClient1Config);
export const sqsClient2 = new SQSClient(sqsClient2Config);
