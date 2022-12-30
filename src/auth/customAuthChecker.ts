import { AuthChecker } from 'type-graphql';
import { AppDataSource } from '../db';
import { User } from '../entities/User';
import { AppContext, Roles } from '../types';

export const customAuthChecker: AuthChecker<AppContext, Roles> = async ({ context }, roles) => {
  const userId = context.req.session.userId;
  if (!userId) {
    throw new Error('User not logged in');
  }

  if (roles.length > 0) {
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .select('user.id')
      .leftJoinAndSelect('user.userRoles', 'roles')
      .where('user.userId = :userId', { userId })
      .getOne();

    if (!user) throw new Error('Access Denied!');
    const userRoles = user.userRoles.map((x) => x.role);

    if (!roles.every((x) => userRoles.includes(x))) throw new Error('Access Denied!');
  }

  return true;
};
