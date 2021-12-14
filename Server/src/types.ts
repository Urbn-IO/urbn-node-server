import { Request, Response } from "express";
import { Redis } from "ioredis";
import { createCategoriesLoader } from "./utils/categoriesLoader";
import { createUsersLoader } from "./utils/usersLoader";

export type AppContext = {
  req: Request;
  res: Response;
  redis: Redis;
  categoriesLoader: ReturnType<typeof createCategoriesLoader>;
  usersLoader: ReturnType<typeof createUsersLoader>;
};

declare module "express-session" {
  export interface SessionData {
    userId: string;
  }
}
