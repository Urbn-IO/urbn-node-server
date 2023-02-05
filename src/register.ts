import { NonEmptyArray } from 'type-graphql';
import { Banks } from './entities/Banks';
import { CallLogs } from './entities/CallLogs';
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
import { CategoryResolver } from './resolvers/category';
import { UserCategoriesResolver } from './resolvers/celebCategories';
import { CelebrityResolver } from './resolvers/celebrity';
import { ExtrasResolver } from './resolvers/featured';
import { PaymentsResolver } from './resolvers/payments';
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
    Shoutout,
    Transactions,
    CallLogs,
    CelebrityApplications,
    Role,
    Featured,
    Banks,
];

// eslint-disable-next-line @typescript-eslint/ban-types
export const resolvers: NonEmptyArray<Function> | NonEmptyArray<string> = [
    CategoryResolver,
    UserResolver,
    UserCategoriesResolver,
    CelebrityResolver,
    RequestsResolver,
    PaymentsResolver,
    VideoCallResolver,
    ExtrasResolver,
    ShoutoutResolver,
];
