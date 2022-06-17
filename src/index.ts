import "dotenv-safe/config.js";
import path from "path";
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import router from "./api/webhook";
import searchRouter from "./api/typeSense";
import firebaseConfig from "./firebaseConfig";
import sqsConsumer from "./services/aws/queues/videoOnDemand";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, __prod__ } from "./constants";
import { createCategoriesLoader } from "./utils/categoriesLoader";
import { createCelebsLoader } from "./utils/celebsLoader";
import { initializeApp } from "firebase-admin/app";
import { entities, resolvers } from "./register";
// import { initializeSearch } from "./services/appSearch/collections";

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
  // initializeSearch();
  sqsConsumer.start();
  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 150, //max cookie age of 150 days
        httpOnly: true,
        sameSite: "none", //subject to change
        secure: true, //__prod__, // cookie only works using https
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
  app.set("trust proxy", !__prod__);
  app.use(
    cors({
      origin: ["https://studio.apollographql.com", "http://localhost:8000", "https://geturbn.io"], //to be revisited when making web version of  app
      credentials: true,
    })
  );

  app.use("/paystack-webhook", router);
  app.use("/text-search", searchRouter);

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers,
      validate: false,
      dateScalarMode: "isoDate",
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      categoriesLoader: createCategoriesLoader(),
      celebsLoader: createCelebsLoader(),
    }),
    // formatError: (err: GraphQLError) => {
    //   if (err.originalError instanceof ApolloError) {
    //     return err;
    //   }
    //   const errId = v4();
    //   console.log(`error Id: ${errId}`);
    //   console.log(err);
    //   return new GraphQLError(`INTERNAL_SERVER_ERROR: ${errId}`);
    // },
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, cors: false });
  app.listen(Port, () => {
    console.log(`running on port ${Port}`);
    console.log("Production Environment: ", __prod__);
  });
};
main().catch((err) => {
  console.error(err);
});
