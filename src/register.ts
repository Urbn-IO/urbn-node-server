import { NonEmptyArray } from 'type-graphql';
import { CallLogs } from './entities/CallLogs';
import { CardAuthorization } from './entities/CardAuthorization';
import { Categories } from './entities/Categories';
import { CelebCategories } from './entities/CelebCategories';
import { Celebrity } from './entities/Celebrity';
import { CelebrityApplications } from './entities/CelebrityApplications';
import { Featured } from './entities/Featured';
import { NotificationToken } from './entities/NotificationToken';
import { Requests } from './entities/Requests';
import { Role } from './entities/Role';
import { Shoutout } from './entities/Shoutout';
import { Transactions } from './entities/Transactions';
import { User } from './entities/User';
import { Wallet } from './entities/Wallet';
import { WalletTransactions } from './entities/WalletTransactions';
import { CardsResolver } from './resolvers/cards';
import { CategoryResolver } from './resolvers/category';
import { UserCategoriesResolver } from './resolvers/celebCategories';
import { CelebrityResolver } from './resolvers/celebrity';
import { ExtrasResolver } from './resolvers/featured';
import { RequestsResolver } from './resolvers/requests';
import { ShoutoutResolver } from './resolvers/shoutout';
import { UserResolver } from './resolvers/user';
import { VideoCallResolver } from './resolvers/videoCalls';

export const entities = [
  User,
  Categories,
  CelebCategories,
  Celebrity,
  Requests,
  NotificationToken,
  CardAuthorization,
  Shoutout,
  Transactions,
  CallLogs,
  Wallet,
  WalletTransactions,
  CelebrityApplications,
  Role,
  Featured,
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
  ShoutoutResolver,
];
