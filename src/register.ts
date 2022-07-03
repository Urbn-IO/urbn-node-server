import { NonEmptyArray } from "type-graphql";
import { CallRoom } from "./entities/CallRoom";
import { CallScheduleBase } from "./entities/CallScheduleBase";
import { CardAuthorization } from "./entities/CardAuthorization";
import { Categories } from "./entities/Categories";
import { CelebCategories } from "./entities/CelebCategories";
import { Celebrity } from "./entities/Celebrity";
import { FcmTokens } from "./entities/FcmTokens";
import { Requests } from "./entities/Requests";
import { Shoutout } from "./entities/Shoutout";
import { User } from "./entities/User";
import { PublicMediaResolver } from "./resolvers/aws/publicMediaResolver";
import { CategoryResolver } from "./resolvers/categoryResolver";
import { UserCategoriesResolver } from "./resolvers/celebCategoriesResolver";
import { CelebrityResolver } from "./resolvers/celebrityResolver";
import { PaymentsResolver } from "./resolvers/paymentsResolver";
import { RequestsResolver } from "./resolvers/requestsResolver";
import { SubscriptionTestResolver } from "./resolvers/subscribTestResolver";
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
  Shoutout,
  CallRoom,
  CallScheduleBase,
];

// eslint-disable-next-line @typescript-eslint/ban-types
export const resolvers: NonEmptyArray<Function> | NonEmptyArray<string> = [
  CategoryResolver,
  UserResolver,
  UserCategoriesResolver,
  PublicMediaResolver,
  CelebrityResolver,
  RequestsResolver,
  PaymentsResolver,
  VideoCallResolver,
  SubscriptionTestResolver,
];