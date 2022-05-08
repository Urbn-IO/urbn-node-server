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
}

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
