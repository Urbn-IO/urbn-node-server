declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_NAME: string;
      APP_BASE_URL: string;
      APP_DYNAMIC_URL_PREFIX: string;
      APP_LOGO_URL: string;
      APP_BUNDLE_NAME: string;
      AWS_BUCKET_NAME: string;
      AWS_PUBLIC_BUCKET_NAME: string;
      AWS_PRIMARY_REGION: string;
      AWS_SECONDARY_REGION: string;
      AWS_ACCESS_KEY: string;
      AWS_SECRET_ACCESS_KEY: string;
      AWS_CLOUD_FRONT_DOMAIN: string;
      AWS_CLOUD_FRONT_KEY_PAIR_ID: string;
      AWS_CLOUD_FRONT_PUBLIC_DISTRIBUTION_DOMAIN: string;
      AWS_SQS_VOD_QUEUE_URL: string;
      FIREBASE_WEBAPI_KEY: string;
      DEFUALT_CURRENCY: string;
      DATABASE_URL: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      SESSION_SECRET: string;
      PAYSTACK_API: string;
      PAYSTACK_PUBLIC_KEY: string;
      PAYSTACK_SECRET_KEY: string;
      PORT: string;
      TYPESENSE_API_KEY: string;
      TYPESENSE_NODE_CLUSTER: string;
      TWILIO_ACCOUNT_SID: string;
      TWILIO_AUTH_TOKEN: string;
      TWILIO_API_KEY: string;
      TWILIO_API_SECRET: string;
      TWILIO_WEBHOOK: string;
      APPLE_ID: string;
      APPLE_TEAM_ID: string;
      APNS_KEY_ID: string;
      APNS_DEV_URL: string;
      APNS_PROD_URL: string;
      APNS_DEVICE_ENDPOINT: string;
      URBN_CONTACT_MAIL: string;
      URBN_SECURITY_MAIL: string;
      APP_FLYER_SDK_DEV_KEY: string;
    }
  }
}

export {};
