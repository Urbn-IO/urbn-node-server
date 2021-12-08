declare namespace NodeJS {
  interface ProcessEnv {
    AWS_BUCKET_NAME: string;
    AWS_BUCKET_REGION: string;
    AWS_ACCESS_KEY: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_CLOUD_FRONT_DOMAIN: string;
    AWS_CLOUD_FRONT_KEY_PAIR_ID: string;
  }
}