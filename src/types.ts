import { Request, Response } from "express";
import { Redis } from "ioredis";
import { createCategoriesLoader } from "./utils/categoriesLoader";
import { createCelebsLoader } from "./utils/celebsLoader";

export type AppContext = {
  req: Request;
  res: Response;
  redis: Redis;
  categoriesLoader: ReturnType<typeof createCategoriesLoader>;
  celebsLoader: ReturnType<typeof createCelebsLoader>;
};

declare module "express-session" {
  export interface SessionData {
    userId: string;
  }
}

export interface NotificationsPayload {
  messageTitle: string;
  messageBody: string;
  tokens: string[];
  data: NotificationsRoute;
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
  ownerId: string | undefined;
  requestId: string | undefined;
  alias: string | undefined;
  contentType: number | undefined;
}

type NotificationsRoute = {
  routeCode: notificationRouteCode;
};

export type RequestInput = {
  requestor: string;
  requestorName: string | undefined;
  recepient: string;
  recepientAlias: string | undefined;
  recepientThumbnail: string;
  requestType: string;
  requestAmountInNaira: string;
  description: string;
  requestExpires: Date;
};

export enum requestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  FULFILLED = "fulfilled",
  UNFULFILLED = "unfulfilled",
}

export enum requestType {
  SHOUTOUT = "shoutout",
  CALL_TYPE_A = "call_type_A",
  CALL_TYPE_B = "call_type_B",
}

export enum notificationRouteCode {
  RESPONSE = "0", // notification to display response from celebrity to a user on the client
  RECEIVED_REQUEST = "1", // notification to route the client to the received requests view
  PROFILE_SHOUTOUT = "2", //  notification to route the client to the user profile
}

export enum contentType {
  SHOUTOUT,
  MOMENT,
}
