export const __prod__ = process.env.Node_ENV === "production";
export const COOKIE_NAME = "urbanauth";
export const APP_SESSION_PREFIX = "session:";
export const RESET_PASSWORD_PREFIX = "reset-password:";
export const CONFIRM_EMAIL_PREFIX = "confirm-email:";
export const config = {
  APP_ROOT: __dirname,
  VIDEO_CALL_TYPE_A_DURATION: 180,
  VIDEO_CALL_TYPE_B_DURATION: 300,
  INSTANT_SHOUTOUT_RATE: 1.5,
  BULL_QUEUE_CONCURRENCY: 20,
  REQUEST_MIN_RATE: 5000,
  REQUEST_MAX_RATE: 50_000_000,
  CALL_QUEUE_NAME: "call_status",
  MAIL_QUEUE_NAME: "mail",
};
