import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

export const APP_NAME = 'Urbn';
export const APP_BUNDLE_NAME = 'io.urbn.urbn';
export const APP_LAUNCH_DATE = dayjs('2023-06-30T00:00:00').utc(true).toDate();
export const APP_BASE_URL = 'https://geturbn.io';
export const __prod__ = process.env.NODE_ENV === 'production';
export const AWS_REGION = 'eu-west-2';
export const DEFUALT_CURRENCY = 'NGN';
export const APP_LOGO_URL = 'https://imgstatic.geturbn.io/assets/Urbn.png';
export const GIFT_GRAPHIC = 'https://imgstatic.geturbn.io/assets/gift-box.svg';
export const AWS_STATIC_VIDEO_BUCKET = 'urbn-video-on-demand-staticvideodestination12ac6f-1pkwm9gv53s94';
export const AWS_SQS_VOD_QUEUE_URL = __prod__
  ? 'https://sqs.eu-west-2.amazonaws.com/234408821758/urbn-video-on-demand'
  : '';
export const AWS_SQS_IMAGE_PROCESSOR_QUEUE_URL = __prod__
  ? 'https://sqs.eu-west-2.amazonaws.com/234408821758/ImageProcessorQueue'
  : '';
export const URBN_MAIL_BOT = 'Urbn <bot@mailer.geturbn.io>';
export const URBN_CONTACT_MAIL = 'mailto:support@geturbn.io';
export const PAYSTACK_API = 'https://api.paystack.co';
export const TWILIO_WEBHOOK = 'https://api.geturbn.io/twilio';
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
export const ACCOUNT_NUMBER_PREFIX = 'account-number-for:';
export const REQUEST_REMINDER_PREFIX = 'request_reminder:';
export const NEW_CELEBRITY_ALERT_PREFIX = 'new_celebrity:';
export const SHOUTOUT_PLAYER_URL = 'https://player.geturbn.io';
export const APP_MAIN_DYNAMIC_URL_PREFIX = 'https://blink.geturbn.io';
export const APP_SHOUTOUT_DYNAMIC_URL_PREFIX = 'https://shoutouts.geturbn.io';
export const APP_CELEBRITY_DYNAMIC_URL_PREFIX = 'https://celebrity.geturbn.io';
export const VIDEO_CALL_TYPE_A_DURATION = 180;
export const VIDEO_CALL_TYPE_B_DURATION = 300;
export const INSTANT_SHOUTOUT_RATE = 2.0;
export const REQUEST_MIN_RATE = 15000;
export const REQUEST_MAX_RATE = 500000;
export const AWS_VOD_STACK_NAME = 'urbn-video-on-demand';
export const AWS_VOD_CUSTOM_JOB_TEMPLATE = '_Ott_540p_Avc_Aac_16x9_qvbr_no_preset';
export const APNS_DEV_URL = 'https://api.sandbox.push.apple.com';
export const APNS_PROD_URL = 'https://api.push.apple.com';
export const APNS_DEVICE_ENDPOINT = '/3/device/';
export const config = {
  APP_ROOT: __dirname,
  BULL_QUEUE_CONCURRENCY: 20,
  CALL_QUEUE_NAME: 'call_status_queue',
  ALERTS_QUEUE_NAME: 'alerts_queue',
  MAIL_QUEUE_NAME: 'mail_queue',
  REQUEST_EXPIRATION_QUEUE_NAME: 'request_expiration_queue',
  CALL_REMINDER_JOB: 'call-reminder',
  REQUEST_REMINDER: 'daily-request-reminder',
  NEW_CELEBRITY_ALERT: 'new-celebrity-alert',
};
export const LOCKDOWN_STATUS = dayjs().utc().isAfter(APP_LAUNCH_DATE) ? 'OFF' : 'ON';
