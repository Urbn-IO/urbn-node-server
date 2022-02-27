import { NonEmptyArray } from "type-graphql";
import { CallTokens } from "./entities/CallTokens";
import { CardAuthorization } from "./entities/CardAuthorization";
import { Categories } from "./entities/Categories";
import { CelebCategories } from "./entities/CelebCategories";
import { Celebrity } from "./entities/Celebrity";
import { FcmTokens } from "./entities/FcmTokens";
import { Requests } from "./entities/Requests";
import { ShoutOuts } from "./entities/ShoutOuts";
import { User } from "./entities/User";
import { PrivateMediaResolver } from "./resolvers/aws/privateMediaResolver";
import { PublicMediaResolver } from "./resolvers/aws/publicMediaResolver";
import { CategoryResolver } from "./resolvers/categoryResolver";
import { UserCategoriesResolver } from "./resolvers/celebCategoriesResolver";
import { CelebrityResolver } from "./resolvers/celebrityResolver";
import { PaymentsResolver } from "./resolvers/paymentsResolver";
import { RequestsResolver } from "./resolvers/requestsResolver";
import { UserResolver } from "./resolvers/userResolver";
import { VideoCallResolver } from "./resolvers/videoCallResolver";

export const entities = [
  User,
  Categories,
  CelebCategories,
  Celebrity,
  Requests,
  FcmTokens,
  CardAuthorization,
  ShoutOuts,
  CallTokens,
];

// eslint-disable-next-line @typescript-eslint/ban-types
export const resolvers: NonEmptyArray<Function> | NonEmptyArray<string> = [
  CategoryResolver,
  UserResolver,
  UserCategoriesResolver,
  PrivateMediaResolver,
  PublicMediaResolver,
  CelebrityResolver,
  RequestsResolver,
  PaymentsResolver,
  VideoCallResolver,
];
