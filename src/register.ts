import { NonEmptyArray } from "type-graphql";
import { CallScheduleBase } from "./entities/CallScheduleBase";
import { CardAuthorization } from "./entities/CardAuthorization";
import { Categories } from "./entities/Categories";
import { CelebCategories } from "./entities/CelebCategories";
import { Celebrity } from "./entities/Celebrity";
import { NotificationToken } from "./entities/NotificationToken";
import { Requests } from "./entities/Requests";
import { Shoutout } from "./entities/Shoutout";
import { Transactions } from "./entities/Transactions";
import { User } from "./entities/User";
import { CategoryResolver } from "./resolvers/category";
import { UserCategoriesResolver } from "./resolvers/celebCategories";
import { CelebrityResolver } from "./resolvers/celebrity";
import { CardsResolver } from "./resolvers/cards";
import { RequestsResolver } from "./resolvers/requests";
import { UserResolver } from "./resolvers/user";
import { VideoCallResolver } from "./resolvers/videoCalls";
import { CallLogs } from "./entities/CallLogs";
import { WalletTransactions } from "./entities/WalletTransactions";
import { Wallet } from "./entities/Wallet";
import { ExtrasResolver } from "./resolvers/extras";
import { CelebrityApplications } from "./entities/CelebrityApplications";

export const entities = [
  User,
  Categories,
  CelebCategories,
  Celebrity,
  Requests,
  NotificationToken,
  CardAuthorization,
  Shoutout,
  CallScheduleBase,
  Transactions,
  CallLogs,
  Wallet,
  WalletTransactions,
  CelebrityApplications,
];

// eslint-disable-next-line @typescript-eslint/ban-types
export const resolvers: NonEmptyArray<Function> | NonEmptyArray<string> = [
  CategoryResolver,
  UserResolver,
  UserCategoriesResolver,
  CelebrityResolver,
  RequestsResolver,
  CardsResolver,
  VideoCallResolver,
  ExtrasResolver,
];
