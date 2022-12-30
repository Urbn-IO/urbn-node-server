import { KeyvAdapter } from '@apollo/utils.keyvadapter';
import KeyvRedis from '@keyv/redis';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import connectRedis from 'connect-redis';
import cors from 'cors';
import 'dotenv-safe/config.js';
import express from 'express';
import session from 'express-session';
import { initializeApp } from 'firebase-admin/app';
import { GraphQLError } from 'graphql';
import { useServer } from 'graphql-ws/lib/use/ws';
import { createServer } from 'http';
import Keyv from 'keyv';
import { buildSchema } from 'type-graphql';
import { WebSocketServer } from 'ws';
import search from './api/typeSense';
import { customAuthChecker } from './auth/customAuthChecker';
import { APP_SESSION_PREFIX, SESSION_COOKIE_NAME, __prod__ } from './constants';
import { AppDataSource } from './db';
import firebaseConfig from './firebaseConfig';
import pubsub from './pubsub';
import initializeWorkers from './queues/job_queue';
import redisClient from './redis/client';
import { resolvers } from './register';
import sqsImageConsumer from './services/aws/queues/imageProcessing';
import sqsVODConsumer from './services/aws/queues/videoOnDemand';
import video from './services/call/twilio/webhook';
import payment from './services/payments/paystack/webhook';
import { createCategoriesLoader } from './utils/categoriesLoader';
import { createCelebsLoader } from './utils/celebsLoader';
import { getSessionContext } from './utils/helpers';

const app = express();
const httpServer = createServer(app);
const redis = redisClient;
const main = async () => {
  const Port = parseInt(process.env.PORT) || 4000;
  initializeApp(firebaseConfig);
  await AppDataSource.initialize()
    .then(() => {
      console.log('Data Source has been initialized!');
    })
    .catch((err) => {
      console.error('Error during Data Source initialization', err);
    });
  // initializeSearch();
  initializeWorkers();

  sqsVODConsumer.start();
  sqsImageConsumer.start();
  const RedisStore = connectRedis(session);

  const store = new RedisStore({
    client: redis as never,
    disableTouch: true,
    prefix: APP_SESSION_PREFIX,
  });
  app.use(
    session({
      name: SESSION_COOKIE_NAME,
      store,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 150, //max cookie age of 150 days
        httpOnly: true,
        sameSite: 'none', //subject to change
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
  app.set('trust proxy', !__prod__);
  app.use(
    cors({
      origin: ['https://studio.apollographql.com', 'http://localhost:8000', 'https://geturbn.io'],
      credentials: true,
    })
  );

  app.use('/twilio', video);
  app.use('/paystack', payment);
  app.use('/search', search);
  app.use('/request-state', search);

  const schema = await buildSchema({
    resolvers,
    validate: {
      stopAtFirstError: true,
      validationError: { target: false },
    },
    authChecker: customAuthChecker,
    dateScalarMode: 'isoDate',
    pubSub: pubsub,
  });

  // Create our WebSocket server using the HTTP server we just set up.
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Save the returned server's info so we can shutdown this server later
  const serverCleanup = useServer(
    {
      schema,
      context: async ({ extra }) => {
        const sess = await getSessionContext(extra.request.headers.cookie as string, store);
        if (!sess?.userId) {
          throw new Error('Users not logged in');
        }
        return { userId: sess.userId };
      },
      onDisconnect: () => {
        console.log('disconnected from websocket 🔌');
      },
    },
    wsServer
  );

  const keyvRedis = new KeyvRedis(redis as never);

  const apolloServer = new ApolloServer({
    schema,
    introspection: !__prod__,
    cache: new KeyvAdapter(new Keyv({ store: keyvRedis, namespace: 'cached-query' })),
    csrfPrevention: true,
    plugins: [
      //response caching
      responseCachePlugin({
        sessionId: async (requestContext) => {
          const cookie = requestContext?.request?.http?.headers.get('cookie') || null;
          if (cookie) {
            const sess = await getSessionContext(cookie, store);
            if (!sess) {
              throw new Error('An error occured');
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
    formatError: (err: GraphQLError) => {
      const errorCode = err.extensions.code;
      if (errorCode === 'GRAPHQL_VALIDATION_FAILED' || errorCode === 'BAD_USER_INPUT') {
        return new GraphQLError(err.message);
      }
      if (errorCode === 'INTERNAL_SERVER_ERROR') {
        const validationErrors = err.extensions.exception.validationErrors;
        if (validationErrors) {
          const constraints = validationErrors[0].constraints;
          const keys = Object.keys(constraints);
          const message = constraints[keys[0]];
          return new GraphQLError(message);
        }
      }

      return err;
    },
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, cors: false });
  httpServer.listen(Port, () => {
    console.log('Production Environment: ', __prod__);
    console.log(`server running on port ${Port} 🚀🚀`);
  });
};
main().catch((err) => {
  console.error(err);
});
