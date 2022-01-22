import "dotenv-safe/config.js";
import path from "path";
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import router from "./api/webhook";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, __prod__ } from "./constants";
import { createCategoriesLoader } from "./utils/categoriesLoader";
import { createCelebsLoader } from "./utils/celebsLoader";
import { initializeApp } from "firebase-admin/app";
import { firebaseConfig } from "./firebaseConfig";
import { entities, resolvers } from "./register";

const app = express();

const main = async () => {
  const Port = parseInt(process.env.PORT) || 4000;

  const connection = await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities,
  });

  await connection.runMigrations();

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
    express.urlencoded({
      extended: true,
    })
  );

  app.use(express.json());
  app.use(
    cors({
      origin: "*", //to be revisited when making web version of  app
      credentials: true,
    })
  );

  app.use("/paystack-webhook", router);

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers,
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
