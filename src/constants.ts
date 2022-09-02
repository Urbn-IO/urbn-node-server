export const __prod__ = process.env.Node_ENV === "production";
export const SESSION_COOKIE_NAME = "urbn_session";
export const APP_SESSION_PREFIX = "session:";
export const VIDE_CALL_PREFIX = "urbn_video_room:";
export const RESET_PASSWORD_PREFIX = "reset-password:";
export const CONFIRM_EMAIL_PREFIX = "confirm-email:";
export const VIDEO_CALL_TYPE_A_DURATION = 180;
export const VIDEO_CALL_TYPE_B_DURATION = 300;
export const INSTANT_SHOUTOUT_RATE = 1.5;
export const REQUEST_MIN_RATE = 5000;
export const REQUEST_MAX_RATE = 50_000_000;
export const config = {
  APP_ROOT: __dirname,
  BULL_QUEUE_CONCURRENCY: 20,
  CALL_QUEUE_NAME: "call_status",
  MAIL_QUEUE_NAME: "mail",
  OPERATIONS_QUEUE_NAME: "operations",
};
