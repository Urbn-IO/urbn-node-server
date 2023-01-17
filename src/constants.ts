export const APP_BASE_URL = 'https://geturbn.io';
export const APP_LOGO_URL = 'https://imgstatic.geturbn.io/assets/Urbn.png';
export const GIFT_GRAPHIC = 'https://imgstatic.geturbn.io/assets/gift-box.svg';
export const SHOUTOUT_PLAYER_URL = 'https://player.geturbn.io';
export const __prod__ = process.env.Node_ENV === 'production';
export const URBN_MAIL_BOT = 'Urbn <bot@mailer.geturbn.io>';
export const URBN_CONTACT_MAIL = 'mailto:support@geturbn.io';
export const STATIC_IMAGE_CDN = 'imgstatic.geturbn.io';
export const STATIC_VIDEO_CDN = 'videostatic.geturbn.io';
export const PREMIUM_VIDEO_CDN = 'premiumstatic.geturbn.io';
export const SESSION_COOKIE_NAME = 'urbn_session';
export const APP_SESSION_PREFIX = 'session:';
export const VIDE_CALL_PREFIX = 'urbn_video_room:';
export const RESET_PASSWORD_PREFIX = 'reset-password:';
export const CONFIRM_EMAIL_PREFIX = 'confirm-email:';
export const CELEB_PREREGISTRATION_PREFIX = 'celeb-prereg:';
export const CALL_RETRY_PREFIX = 'call-retries:';
export const APP_MAIN_DYNAMIC_URL_PREFIX = 'https://blink.geturbn.io';
export const APP_SHOUTOUT_DYNAMIC_URL_PREFIX = 'https://shoutouts.geturbn.io';
export const APP_CELEBRITY_DYNAMIC_URL_PREFIX = 'https://celebrity.geturbn.io';
export const VIDEO_CALL_TYPE_A_DURATION = 180;
export const VIDEO_CALL_TYPE_B_DURATION = 300;
export const INSTANT_SHOUTOUT_RATE = 2.0;
export const REQUEST_MIN_RATE = 5000;
export const REQUEST_MAX_RATE = 50_000_000;
export const config = {
  APP_ROOT: __dirname,
  BULL_QUEUE_CONCURRENCY: 20,
  CALL_QUEUE_NAME: 'call_status',
  MAIL_QUEUE_NAME: 'mail',
  OPERATIONS_QUEUE_NAME: 'operations',
};
