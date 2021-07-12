import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Request, Response } from "express";
import { createCategoriesLoader } from "./utils/categoriesLoader";

export type Mycontext = {
  em: EntityManager<IDatabaseDriver<Connection>>;
  req: Request;
  res: Response;
  categoriesLoader: ReturnType<typeof createCategoriesLoader>;
};

declare module "express-session" {
  export interface SessionData {
    userId: string;
  }
}
