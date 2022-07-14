import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";

const primaryRegion = process.env.AWS_PRIMARY_REGION;
const secondaryRegion = process.env.AWS_SECONDARY_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3PrimaryClientConfig: S3ClientConfig = {
  region: primaryRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};
const s3SecondaryClientConfig: S3ClientConfig = {
  region: secondaryRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};
export const s3primaryClient = new S3Client(s3PrimaryClientConfig);
export const s3SecondaryClient = new S3Client(s3SecondaryClientConfig);
