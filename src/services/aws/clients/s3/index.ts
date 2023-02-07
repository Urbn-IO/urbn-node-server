import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { AWS_REGION } from 'constant';

const awsRegion = AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Config1: S3ClientConfig = {
  region: awsRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};

export const client = new S3Client(s3Config1);
