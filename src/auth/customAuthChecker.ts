import { AuthChecker } from 'type-graphql';
import { AppContext } from '../types';

export const customAuthChecker: AuthChecker<AppContext, string> = ({ context }, roles) => {
  if (!context.req.session.userId) {
    throw new Error('User not logged in');
  }

  if (roles.length > 0) {
    console.log(roles);
  }

  return true;
};
