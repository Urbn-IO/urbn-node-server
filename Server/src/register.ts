import { NonEmptyArray } from "type-graphql";
import { CardAuthorization } from "./entities/CardAuthorization";
import { Categories } from "./entities/Categories";
import { CelebCategories } from "./entities/CelebCategories";
import { Celebrity } from "./entities/Celebrity";
import { FcmTokens } from "./entities/FcmTokens";
import { Requests } from "./entities/Requests";
import { User } from "./entities/User";
import { S3Resolver } from "./resolvers/aws/S3Resolver";
import { CategoryResolver } from "./resolvers/categoryResolver";
import { UserCategoriesResolver } from "./resolvers/celebCategoriesResolver";
import { CelebrityResolver } from "./resolvers/celebrityResolver";
import { PaymentsResolver } from "./resolvers/paymentsResolver";
import { RequestsResolver } from "./resolvers/requestsResolver";
import { UserResolver } from "./resolvers/userResolver";

export const entities = [
  User,
  Categories,
  CelebCategories,
  Celebrity,
  Requests,
  FcmTokens,
  CardAuthorization,
];

// eslint-disable-next-line @typescript-eslint/ban-types
export const resolvers: NonEmptyArray<Function> | NonEmptyArray<string> = [
  CategoryResolver,
  UserResolver,
  UserCategoriesResolver,
  S3Resolver,
  CelebrityResolver,
  RequestsResolver,
  PaymentsResolver,
];
