import { Request, Response } from "express";
import { Redis } from "ioredis";
import { createCategoriesLoader } from "./utils/categoriesLoader";
import { createCelebsLoader } from "./utils/celebsLoader";
import { RedisPubSub } from "graphql-redis-subscriptions";
import { VideoCallEvent } from "./utils/graphqlTypes";

export type AppContext = {
  req: Request;
  res: Response;
  redis: Redis;
  pubsub: RedisPubSub;
  categoriesLoader: ReturnType<typeof createCategoriesLoader>;
  celebsLoader: ReturnType<typeof createCelebsLoader>;
};

declare module "express-session" {
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
export interface NotificationsPayloadTest {
  messageTitle?: string;
  messageBody?: string;
  tokens: string[];
  data?: any;
  priority?: NotificationPriority;
  ttl?: number;
}

export interface VideoOutput {
  workFlowId: string | undefined;
  hlsUrl: string | undefined;
  thumbnailUrl: string | undefined;
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

export type TransactionsMetadata = {
  userId: string;
  recipient: string;
  availableSlotId?: number;
};
export type CachedCallEventPayload = {
  roomName: string;
  roomSid: string;
  roomStatus: string;
  participantA: string;
  participantB?: string;
  callLength: number;
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
  email: string[];
  ccTo?: string[];
  subject: EmailSubject;
  url: string;
  sourcePlatform?: PlatformOptions;
};
export type UpdateCallDurationArgs = {
  roomSid: string;
};

export enum NotificationPriority {
  HIGH,
  NORMAL,
}

export enum RequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  PROCESSING = "processing",
  FAILED = "failed",
  FULFILLED = "fulfilled",
  UNFULFILLED = "unfulfilled",
}

export enum RequestType {
  SHOUTOUT = "shoutout",
  CALL_TYPE_A = "call_type_A",
  CALL_TYPE_B = "call_type_B",
}

export enum CallType {
  CALL_TYPE_A,
  CALL_TYPE_B,
}

export enum SubscriptionTopics {
  VIDEO_CALL = "video_call",
  CALL_STATUS = "call_status",
  NEW_CARD = "new_card",
  TEST_TOPIC = "test",
}

export enum NotificationRouteCode {
  RESPONSE = "0", // notification to display response from celebrity to a user on the client
  RECEIVED_REQUEST = "1", // notification to route the client to the received requests view
  PROFILE_SHOUTOUT = "2", //  notification to route the client to the user profile
  DEFAULT = "10", //default route
}

export enum ContentType {
  SHOUTOUT,
  MOMENT,
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
  IOS = "IOS",
  ANDROID = "ANDROID",
  WEB = "WEB BROWSER",
}

export enum EmailTemplates {
  ConfirmEmailTemplate = "ConfirmEmailTemplate",
  ResetPasswordTemplate = "ResetPasswordTemplate",
  SecurityAlertTemplate = "SecurityAlertTemplate",
}

export enum EmailSubject {
  CONFIRM,
  RESET,
  SECURITY,
}
