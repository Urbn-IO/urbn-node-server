import { Arg, Authorized, Ctx, Int, Mutation, Resolver, ResolverFilterData, Root, Subscription } from 'type-graphql';
import AppDataSource from '../config/ormconfig';
import { CardAuthorization } from '../entities/CardAuthorization';
import { User } from '../entities/User';
import paymentManager from '../services/payments/payments';
import { AppContext, SubscriptionTopics } from '../types';
import { InitializeCardResponse, VerifyCardResponse } from '../utils/graphqlTypes';

@Resolver()
export class CardsResolver {
  @Mutation(() => InitializeCardResponse)
  @Authorized()
  async addCard(@Ctx() { req }: AppContext): Promise<InitializeCardResponse> {
    let defaultCard = false;
    const userId = req.session.userId as string;
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .select(['user.email'])
      .where('user.userId = :userId', { userId })
      .leftJoinAndSelect('user.cards', 'cards')
      .getOne();

    if (!user) return { errorMessage: 'User not found' };
    if (user.cards.length < 1) defaultCard = true;
    const email = user.email;
    const amount = 50 * 100;
    const stringAmount = amount.toString();
    const result = await paymentManager().initializeCard(email, userId, stringAmount, defaultCard);
    if (!result) {
      return {
        errorMessage: 'An error occured while adding this card. Try another card or try again later',
      };
    }
    return result;
  }

  @Subscription({
    topics: SubscriptionTopics.NEW_CARD,
    filter: ({
      payload,
      context,
    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ResolverFilterData<VerifyCardResponse, any, any>) => {
      return context.userId === payload.userId;
    },
  })
  verifyCard(@Root() verification: VerifyCardResponse): VerifyCardResponse {
    const status = verification.status;
    if (status) verification.message = 'Card successfully verified';
    else verification.message = 'Unable to verify this card. Please try again or try another card';
    return verification;
  }

  @Mutation(() => Boolean)
  @Authorized()
  async setDefaultCard(@Arg('id', () => Int) id: number, @Ctx() { req }: AppContext): Promise<boolean> {
    const userId = req.session.userId;
    try {
      const user = await User.findOne({
        where: { userId },
        relations: ['cards'],
        select: ['cards'],
      });
      if (!user) return false;
      const cards = user.cards;
      const cardToSet = cards.find((x) => x.id === id);
      if (!cardToSet) return false;
      const isDefault = cards.some((x) => {
        if (x.id === id && x.defaultCard === true) return true;
        if (x.id === id) x.defaultCard = true;
        else x.defaultCard = false;
        return false;
      });
      if (isDefault) return true;
      await CardAuthorization.save(cards);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
