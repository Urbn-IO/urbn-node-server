import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";

const awsRegion1 = process.env.AWS_REGION_1;
const awsRegion2 = process.env.AWS_REGION_2;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Config1: S3ClientConfig = {
  region: awsRegion1,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};
const s3Config2: S3ClientConfig = {
  region: awsRegion2,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};
export const s3Client1 = new S3Client(s3Config1);
export const s3Client2 = new S3Client(s3Config2);
