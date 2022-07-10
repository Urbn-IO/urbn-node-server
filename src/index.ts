import "dotenv-safe/config.js";
import path from "path";
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import router from "./services/payments/webhooks/paystack";
import searchRouter from "./api/typeSense";
import firebaseConfig from "./firebaseConfig";
import sqsConsumer from "./services/aws/queues/videoOnDemand";
import pubsub from "./pubsub";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, __prod__ } from "./constants";
import { createCategoriesLoader } from "./utils/categoriesLoader";
import { createCelebsLoader } from "./utils/celebsLoader";
import { initializeApp } from "firebase-admin/app";
import { entities, resolvers } from "./register";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { createServer } from "http";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { getUserId } from "./utils/helpers";

// import { initializeSearch } from "./services/appSearch/collections";

const app = express();
const httpServer = createServer(app);

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
  const store = new RedisStore({ client: redis, disableTouch: true });
  app.use(
    session({
      name: COOKIE_NAME,
      store,
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

  app.use("/paystack", router);
  app.use("/text-search", searchRouter);

  const schema = await buildSchema({
    resolvers,
    validate: false,
    dateScalarMode: "isoDate",
    pubSub: pubsub,
  });

  // Create our WebSocket server using the HTTP server we just set up.
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  // Save the returned server's info so we can shutdown this server later
  const serverCleanup = useServer(
    {
      schema,
      context: async ({ extra }) => {
        const userId = await getUserId(extra.request.headers.cookie as string, store);
        if (!userId) {
          throw new Error("User not logged in");
        }
        return userId;
      },
      onDisconnect: () => {
        console.log("socket connection disconnected 🔌");
      },
    },
    wsServer
  );

  const apolloServer = new ApolloServer({
    schema,
    cache: "bounded",
    csrfPrevention: true,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      pubsub,
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
  httpServer.listen(Port, () => {
    console.log(`server running on port ${Port} 🚀🚀`);
    console.log("Production Environment: ", __prod__);
  });
};
main().catch((err) => {
  console.error(err);
});
