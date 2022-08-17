import "dotenv-safe/config.js";
import express from "express";
import cors from "cors";
import session from "express-session";
import connectRedis from "connect-redis";
import payment from "./services/payments/paystack/webhook";
import video from "./services/video/twilio/webhook";
import search from "./api/typeSense";
import firebaseConfig from "./firebaseConfig";
import sqsConsumer from "./services/aws/queues/videoOnDemand";
import redisClient from "./redis/client";
import pubsub from "./pubsub";
import responseCachePlugin from "apollo-server-plugin-response-cache";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { APP_SESSION_PREFIX, COOKIE_NAME, __prod__ } from "./constants";
import { createCategoriesLoader } from "./utils/categoriesLoader";
import { createCelebsLoader } from "./utils/celebsLoader";
import { initializeApp } from "firebase-admin/app";
import { resolvers } from "./register";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { createServer } from "http";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { getSessionContext } from "./utils/helpers";
import { AppDataSource } from "./db";

const app = express();
const httpServer = createServer(app);
const redis = redisClient;

const main = async () => {
  const Port = parseInt(process.env.PORT) || 4000;
  initializeApp(firebaseConfig);
  AppDataSource.initialize()
    .then(() => {
      console.log("Data Source has been initialized!");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });
  // initializeSearch();
  sqsConsumer.start();
  const RedisStore = connectRedis(session);

  const store = new RedisStore({ client: redis, disableTouch: true, prefix: APP_SESSION_PREFIX });
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

  app.use("/twilio", video);
  app.use("/paystack", payment);
  app.use("/search", search);

  const schema = await buildSchema({
    resolvers,
    validate: { stopAtFirstError: true, validationError: { target: false } },
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
        const sess = await getSessionContext(extra.request.headers.cookie as string, store);
        if (!sess?.userId) {
          throw new Error("Userss not logged in");
        }
        return sess.userId;
      },
      onDisconnect: () => {
        console.log("disconnected from websocket 🔌");
      },
    },
    wsServer
  );

  const apolloServer = new ApolloServer({
    schema,
    introspection: !__prod__,
    cache: "bounded",
    csrfPrevention: true,
    plugins: [
      //response caching
      responseCachePlugin({
        sessionId: async (requestContext) => {
          const cookie = requestContext?.request?.http?.headers.get("cookie") || null;
          if (cookie) {
            const sess = await getSessionContext(cookie, store);
            if (!sess) {
              throw new Error("An error occured");
            }
            return sess.sessionId;
          }
          return null;
        },
      }),
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
