import { AppContext } from "src/types";
import { MiddlewareFn } from "type-graphql";

export const isAuth: MiddlewareFn<AppContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error("User Not Logged In");
  }

  return next();
};
