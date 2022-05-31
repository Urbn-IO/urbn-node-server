import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";

const region = process.env.AWS_BUCKET_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Config: S3ClientConfig = {
  region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
};
const client = new S3Client(s3Config);
export default client;
