declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_NAME: string;
      AWS_BUCKET_NAME: string;
      AWS_PUBLIC_BUCKET_NAME: string;
      AWS_BUCKET_REGION: string;
      AWS_VOD_REGION: string;
      AWS_ACCESS_KEY: string;
      AWS_SECRET_ACCESS_KEY: string;
      AWS_CLOUD_FRONT_DOMAIN: string;
      AWS_CLOUD_FRONT_KEY_PAIR_ID: string;
      AWS_CLOUD_FRONT_PUBLIC_DISTRIBUTION_DOMAIN: string;
      AWS_SQS_VOD_QUEUE_URL: string;
      DATABASE_URL: string;
      REDIS_URL: string;
      PORT: string;
      SESSION_SECRET: string;
      PAYSTACK_PUBLIC_KEY: string;
      PAYSTACK_SECRET_KEY: string;
      TYPESENSE_API_KEY: string;
      TYPESENSE_NODE_CLUSTER: string;
      TWILIO_ACCOUNT_SID: string;
      TWILIO_AUTH_TOKEN: string;
      TWILIO_API_KEY: string;
      TWILIO_API_SECRET: string;
    }
  }
}

export {}
