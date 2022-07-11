import { Request, Response } from "express";
import { Redis } from "ioredis";
import { createCategoriesLoader } from "./utils/categoriesLoader";
import { createCelebsLoader } from "./utils/celebsLoader";
import { RedisPubSub } from "graphql-redis-subscriptions";

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

export type TransactionsMetadata = {
  userId: string;
  recipient: string;
  availableSlotId?: number;
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
