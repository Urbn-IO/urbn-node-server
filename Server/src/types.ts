import { Request, Response } from "express";
import { Redis } from "ioredis";
// import { createCategoriesLoader } from "./utils/categoriesLoader";

export type AppContext = {
  req: Request;
  res: Response;
  redis: Redis;
  // categoriesLoader: ReturnType<typeof createCategoriesLoader>;
};

declare module "express-session" {
  export interface SessionData {
    userId: string;
  }
}
