import { AppContext } from "../types";
import { MiddlewareFn } from "type-graphql";

export const isAuthenticated: MiddlewareFn<AppContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error("User Not Logged In");
  }

  return next();
};