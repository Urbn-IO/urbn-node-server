declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_NAME: string;
      APP_BASE_URL: string;
      APP_DYNAMIC_URL_PREFIX: string;
      APP_LOGO_URL: string;
      APP_BUNDLE_NAME: string;
      AWS_VOD_STACK_NAME: string;
      AWS_STATIC_VIDEO_BUCKET: string;
      AWS_REGION: string;
      AWS_ACCESS_KEY: string;
      AWS_SECRET_ACCESS_KEY: string;
      AWS_STATIC_IMAGE_DISTRIBUTION_DOMAIN: string;
      AWS_STATIC_IMAGE_DISTRIBUTION_KEYPAIR: string;
      AWS_VOD_STATIC_DISTRIBUTION_DOMAIN: string;
      AWS_VOD_STATIC_DISTRIBUTION_KEYPAIR: string;
      AWS_SQS_VOD_QUEUE_URL: string;
      AWS_SQS_IMAGE_PROCESSOR_QUEUE_URL: string;
      AWS_VOD_CUSTOM_JOB_TEMPLATE: string;
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

export {}
