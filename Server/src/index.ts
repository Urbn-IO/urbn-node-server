import "dotenv-safe/config";
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
import { UserCategoriesResolver } from "./resolvers/celebCategoriesResolver";
import { CelebCategories } from "./entities/CelebCategories";
import { S3Resolver } from "./resolvers/aws/S3Resolver";
import { createCelebsLoader } from "./utils/celebsLoader";
import { Celebrity } from "./entities/Celebrity";
import { CelebrityResolver } from "./resolvers/celebrityResolver";
import { RequestsResolver } from "./resolvers/requestsResolver";
import { Requests } from "./entities/Requests";
import { FcmTokens } from "./entities/fcmTokens";
import { initializeApp } from "firebase-admin/app";
import { firebaseConfig } from "./firebaseConfig";

const main = async () => {
  const Port = parseInt(process.env.PORT) || 4000;
  const connection = await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [
      User,
      Categories,
      CelebCategories,
      Celebrity,
      Requests,
      FcmTokens,
    ],
  });

  await connection.runMigrations();

  const app = express();
  initializeApp(firebaseConfig);
  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

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
      secret: process.env.SESSION_SECRET,
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
        CelebrityResolver,
        RequestsResolver,
      ],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      categoriesLoader: createCategoriesLoader(),
      celebsLoader: createCelebsLoader(),
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
