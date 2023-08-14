import { Request, Response } from 'express';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { Redis } from 'ioredis';
import { createCategoriesLoader } from 'utils/categoriesLoader';
import { createCelebsLoader } from 'utils/celebsLoader';
import { VideoCallEvent } from 'utils/graphqlTypes';

export type AppContext = {
  req: Request;
  res: Response;
  redis: Redis;
  pubsub: RedisPubSub;
  categoriesLoader: ReturnType<typeof createCategoriesLoader>;
  celebsLoader: ReturnType<typeof createCelebsLoader>;
};

declare module 'express-session' {
  export interface SessionData {
    userId: string;
  }
}

export interface NotificationsPayload {
  messageTitle?: string;
  messageBody?: string;
  tokens: string[];
  data?: { [key: string]: string };
  priority?: NotificationPriority;
  ttl?: number;
  topic?: 'Celebrities' | 'General' | 'Test';
  imageUrl?: string;
}

export interface VideoOutput {
  workFlowId: string | undefined;
  hlsUrl: string | undefined;
  thumbnailUrl: string | undefined;
  lowResPlaceholderUrl: string | undefined;
  mp4Url: string | undefined;
  srcVideo: string | undefined;
  datePublished: string | undefined;
  durationInSeconds: string | undefined;
  userId: string | undefined;
  owner: string | undefined;
  reference: string | undefined;
  alias: string | undefined;
  contentType: ContentType | undefined;
}

export type SendEmailInputType = {
  emailAddresses: string[];
  subject: EmailSubject;
  name?: string;
  url?: string;
  celebAlias?: string;
  duration?: string;
  expiration?: string;
  amount?: string;
  currency?: string;
  requestType?: string;
  gift?: string;
  ccTo?: string[];
  sourcePlatform?: PlatformOptions;
};

export interface EmailInput extends Omit<SendEmailInputType, 'emailAddresses' | 'subject' | 'ccTo'> {
  logo: string;
  year: string;
  contact: string;
  date?: string;
}

export interface OAuth {
  displayName?: string;
  email?: string;
}

export interface ImageProcessorQueueOutput {
  userId?: string;
  status?: 'success' | 'failed';
  thumbnail?: string;
  lowResPlaceholder?: string;
}
export interface CallRetriesState {
  attempts: number;
  expiry: number;
  requestId: number;
  customer: string;
  customerDisplayName: string;
  celebrity: string;
  celebThumbnail: string;
}
export type TransactionsMetadata = {
  userId: string;
  reference?: string;
  celebrity?: string;
  //for card initilization
  email?: string;
  newCard?: boolean;
  defaultCard?: boolean;
  //types for call request metadata
  availableSlotId?: string;
  availableDay?: DayOfTheWeek;
};
export type CachedCallEventPayload = {
  requestId: number;
  roomName: string;
  roomSid: string;
  roomStatus: string;
  callLength: number;
  participantA: string;
  participantB?: string;
  startTime?: Date;
  queue?: string;
};

export type CallTimerOptions = {
  start?: boolean;
  end?: boolean;
  payload?: CachedCallEventPayload;
  event?: VideoCallEvent;
  roomName?: string;
};

export type UpdateCallDurationArgs = {
  roomSid: string;
};

export type CallLogInput = {
  participantA: string;
  participantB?: string;
  requestId: number;
  callDuration: number;
  elapsedDuration?: number;
};

export type BankAccountCachedPayload = {
  accountNumber: string;
  accountName: string;
  bankCode: string;
};

export type PartialWithRequired<T, K extends keyof T> = Pick<T, K> & Partial<T>;

export enum Roles {
  ADMIN = 'ADMIN',
  USER = 'USER',
  CELEBRITY = 'CELEBRITY',
}

export enum CelebPopularityIndex {
  REGIONAL,
  STAR,
  SUPERSTAR,
  ICON,
}

export enum NotificationPriority {
  HIGH,
  NORMAL,
}

export enum RequestStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  // VALIDATING = 'Validating',
  PROCESSING = 'Processing',
  FAILED = 'Failed',
  FULFILLED = 'Fulfilled',
  UNFULFILLED = 'Unfulfilled',
  EXPIRED = 'Expired',
}

export enum RequestType {
  SHOUTOUT = 'shoutout',
  INSTANT_SHOUTOUT = 'instant_shoutout',
  CALL_TYPE_A = 'call_type_A',
  CALL_TYPE_B = 'call_type_B',
}

export enum CallType {
  CALL_TYPE_A,
  CALL_TYPE_B,
}

export enum SubscriptionTopics {
  VIDEO_CALL = 'video_call',
  CALL_STATUS = 'call_status',
  Verify_Payment = 'verify_payment',
}

export enum NotificationRouteCode {
  DEFAULT = '0', // notification to display response to client UI
  RECEIVED_REQUEST = '1', // notification to route the client to the received requests view
  PROFILE_SHOUTOUT = '2', //  notification to route the client to the user profile
  ONBOARD_CELEB = '3', // notification to display response to client UI and call loggedinuser for celeb onboarding
}

export enum ContentType {
  SHOUTOUT = 'shoutout',
  BANNER = 'banner',
  MOMENT = 'moment',
}

export enum DayOfTheWeek {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
}
export interface AvailableDay {
  availableDay: DayOfTheWeek;
}

export enum PlatformOptions {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB BROWSER',
}

export enum EmailTemplate {
  ConfirmEmailTemplate = 'ConfirmEmailTemplate',
  ResetPasswordTemplate = 'ResetPasswordTemplate',
  SecurityAlertTemplate = 'SecurityAlertTemplate',
  AcceptedRequestTemplate = 'AcceptedRequestTemplate',
  DeclinedRequestTemplate = 'DeclinedRequestTemplate',
  CelebrityVerifiedTemplate = 'CelebrityVerifiedTemplate',
  GiftShoutoutTemplate = 'GiftShoutoutTemplate',
  ShoutoutReceivedTemplate = 'ShoutoutReceivedTemplate',
  CelebrityRegistrationTemplate = 'CelebrityRegistrationTemplate',
}

export enum EmailSubject {
  CONFIRM_EMAIL,
  RESET_PASSWORD,
  SECURITY_ALERT,
  ACCEPTED_REQUEST,
  DECLINED_REQUEST,
  CELEBRITY_VERIFIED,
  GIFT_SHOUTOUT,
  SHOUTOUT_RECEIEVED,
  CELEBRITY_REGISTRATION,
}

export enum SignInMethod {
  BASIC = 'BASIC_AUTH',
  OAUTH = 'OAUTH',
}

export enum PaymentStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum PaymentGateway {
  PAYSTACK = 'paystack',
}

export enum Currency {
  NAIRA = 'NGN',
  GH_CEDIS = 'GHS',
  SA_RAND = 'ZAR',
  US_DOLLARS = 'USD',
}

export enum CacheControlScope {
  PUBLIC,
  PRIVATE,
}
