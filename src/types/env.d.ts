declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AWS_ACCESS_KEY: string;
      AWS_SECRET_ACCESS_KEY: string;
      AWS_STATIC_IMAGE_DISTRIBUTION_KEYPAIR: string;
      AWS_VOD_STATIC_DISTRIBUTION_KEYPAIR: string;
      FIREBASE_WEBAPI_KEY: string;
      DATABASE_NAME: string;
      DATABASE_HOST: string;
      DATABASE_PORT: string;
      DATABASE_USERNAME: string;
      DATABASE_PASSWORD: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      SESSION_SECRET: string;
      PAYSTACK_PUBLIC_KEY: string;
      PAYSTACK_SECRET_KEY: string;
      TYPESENSE_API_KEY: string;
      TYPESENSE_NODE_CLUSTER: string;
      TWILIO_ACCOUNT_SID: string;
      TWILIO_AUTH_TOKEN: string;
      TWILIO_API_KEY: string;
      TWILIO_API_SECRET: string;
      APPLE_ID: string;
      APPLE_TEAM_ID: string;
      APNS_KEY_ID: string;
      APPLE_IN_APP_PURCHASE_KEY_ID: string;
      APP_STORE_CONNECT_ISSUER_ID: string;
    }
  }
}

export {}
