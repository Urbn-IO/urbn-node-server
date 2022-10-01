import { SESClient, SESClientConfig } from "@aws-sdk/client-ses";

const region = process.env.AWS_REGION_1;
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
