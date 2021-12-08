import "dotenv/config";
import { createConnection } from "typeorm";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/userResolver";
import cors from "cors";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { COOKIE_NAME, __prod__ } from "./constants";
import { CategoryResolver } from "./resolvers/categoryResolver";
import path from "path";
import { Categories } from "./entities/Categories";
import { User } from "./entities/User";
import { createCategoriesLoader } from "./utils/categoriesLoader";
import { UserCategoriesResolver } from "./resolvers/UserCategoriesResolver";
import { UserCategories } from "./entities/UserCategories";
import { S3Resolver } from "./resolvers/AWShandlers/S3Resolver";

const main = async () => {
  const Port = process.env.PORT || 8000;
  createConnection({
    type: "postgres",
    database: "ShoutOut",
    username: "admin",
    // password: "InfinityFarmery",
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [User, Categories, UserCategories],
  });

  const app = express();
  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 150, //max cookie age of 150 days
        httpOnly: true,
        sameSite: "lax", //subject to change
        secure: __prod__, // cookie only works using https (we use https in production)
      },
      saveUninitialized: false,
      secret: "process.env.SESSION_SECRET",
      resave: false,
    })
  );
  app.use(
    cors({
      origin: "*", //to be revisited when making web version of  app
      credentials: true,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [
        CategoryResolver,
        UserResolver,
        UserCategoriesResolver,
        S3Resolver,
      ],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      categoriesLoader: createCategoriesLoader(),
    }),
  });
  apolloServer.applyMiddleware({ app, cors: false });
  app.listen(Port, () => {
    console.log(`running on port ${Port}`);
  });
};
main().catch((err) => {
  console.error(err);
});
