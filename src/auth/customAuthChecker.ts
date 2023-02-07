import { GraphQLError } from 'graphql';
import { AuthChecker } from 'type-graphql';
import AppDataSource from 'config/ormconfig';
import { User } from 'entities/User';
import { AppContext, Roles } from 'types';

export const customAuthChecker: AuthChecker<AppContext, Roles> = async ({ context }, roles) => {
  const userId = context.req.session.userId;
  if (!userId) {
    throw new GraphQLError('User not logged in', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }

  if (roles.length > 0) {
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .select('user.id')
      .leftJoinAndSelect('user.userRoles', 'roles')
      .where('user.userId = :userId', { userId })
      .getOne();

    if (!user) {
      throw new GraphQLError('Access Denied!', {
        extensions: {
          code: 'UNAUTHORIZED',
          http: { status: 403 },
        },
      });
    }
    const userRoles = user.userRoles.map((x) => x.role);

    if (!roles.every((x) => userRoles.includes(x)))
      throw new GraphQLError('Access Denied!', {
        extensions: {
          code: 'UNAUTHORIZED',
          http: { status: 403 },
        },
      });
  }

  return true;
};
