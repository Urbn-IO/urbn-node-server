import { Request, Response } from 'express';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { Redis } from 'ioredis';
import { createCategoriesLoader } from '../utils/categoriesLoader';
import { createCelebsLoader } from '../utils/celebsLoader';
import { VideoCallEvent } from '../utils/graphqlTypes';

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
  requestId: string | undefined;
  alias: string | undefined;
  contentType: number | undefined;
}

export interface EmailBaseInput {
  logo: string;
  year: string;
  contact: string;
  name?: string;
  url: string;
  sourcePlatform?: string;
  time?: string;
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

export type TransactionsMetadata = {
  userId: string;
  requestRef?: string;
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

export type SendEmailInputType = {
  name?: string;
  emailAddresses: string[];
  ccTo?: string[];
  subject: EmailSubject;
  url: string;
  sourcePlatform?: PlatformOptions;
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

export type PartialWithRequired<T, K extends keyof T> = Pick<T, K> & Partial<T>;

export enum Roles {
  USER,
  CELEBRITY,
}

export enum NotificationPriority {
  HIGH,
  NORMAL,
}

export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  VALIDATING = 'validating',
  PROCESSING = 'processing',
  FAILED = 'failed',
  FULFILLED = 'fulfilled',
  UNFULFILLED = 'unfulfilled',
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
  NEW_CARD = 'new_card',
  TEST_TOPIC = 'test',
}

export enum NotificationRouteCode {
  RESPONSE = '0', // notification to display response to client UI
  RECEIVED_REQUEST = '1', // notification to route the client to the received requests view
  PROFILE_SHOUTOUT = '2', //  notification to route the client to the user profile
  DEFAULT = '10', //default route
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

export enum PlatformOptions {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB BROWSER',
}

export enum EmailTemplate {
  ConfirmEmailTemplate = 'ConfirmEmailTemplate',
  ResetPasswordTemplate = 'ResetPasswordTemplate',
  SecurityAlertTemplate = 'SecurityAlertTemplate',
}

export enum EmailSubject {
  CONFIRM,
  RESET,
  SECURITY,
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
