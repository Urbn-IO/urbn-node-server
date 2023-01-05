import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

const awsRegion1 = process.env.AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Config1: S3ClientConfig = {
  region: awsRegion1,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};

export const client = new S3Client(s3Config1);
