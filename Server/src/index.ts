import { MikroORM } from "@mikro-orm/core";
import mikroOrmConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/userResolver";

import redis from "redis";
import session from "express-session";
import connecRedis from "connect-redis";
import { __prod__ } from "./constants";
import { Mycontext } from "./types";

const main = async () => {
  const Port = process.env.PORT || 8000;
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();
  const app = express();
  const RedisStore = connecRedis(session);
  const redisClient = redis.createClient();

  app.use(
    session({
      name: "cookieId",
      store: new RedisStore({ client: redisClient, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 150, //max cookie age of 150 days
        httpOnly: true,
        sameSite: "lax", //subject to change
        secure: __prod__, // cookie only works using https (we use https in production)
      },
      saveUninitialized: false,
      secret: "keyboard cat",
      resave: false,
    })
  );
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): Mycontext => ({ em: orm.em, req, res }),
  });
  apolloServer.applyMiddleware({ app });
  app.listen(Port, () => {
    console.log(`running on port ${Port}`);
  });
};
main().catch((err) => {
  console.error(err);
});
