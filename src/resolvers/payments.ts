import { Arg, Authorized, Ctx, Query, Resolver, ResolverFilterData, Root, Subscription } from 'type-graphql';
import CacheControl from '../cache/cacheControl';
import AppDataSource from '../config/ormconfig';
import { ACCOUNT_NUMBER_PREFIX } from '../constants';
import { Banks } from '../entities/Banks';
import paymentManager from '../services/payments/payments';
import { AppContext, BankAccountCachedPayload, SubscriptionTopics } from '../types';
import { AccountNumberInput, VerifyAccountNumberResponse, VerifyPaymentResponse } from '../utils/graphqlTypes';

@Resolver()
export class PaymentsResolver {
  @Subscription({
    topics: SubscriptionTopics.Verify_Payment,
    filter: ({
      payload,
      context,
    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ResolverFilterData<VerifyPaymentResponse, any, any>) => {
      return context.userId === payload.userId;
    },
  })
  verifyPayment(@Root() verification: VerifyPaymentResponse): VerifyPaymentResponse {
    const status = verification.status;
    if (status) verification.message = 'Payment successfully verified';
    else verification.message = 'Payment failed! Try using another card';
    return verification;
  }

  @Query(() => [Banks])
  @CacheControl({ maxAge: 60 * 60 * 24 * 180 }) //cache for 6 months
  @Authorized()
  async getBanks(): Promise<Banks[]> {
    const banks = await AppDataSource.query(`SELECT * FROM banks ORDER BY name ASC`);
    return banks;
  }

  @Query(() => VerifyAccountNumberResponse)
  @Authorized()
  async verifyAccountNumber(
    @Arg('input') input: AccountNumberInput,
    @Ctx() { req, redis }: AppContext
  ): Promise<VerifyAccountNumberResponse> {
    const userId = req.session.userId as string;
    const response = await paymentManager().verifyAccountNumber(input.bankCode, input.accountNumber);
    if (!response) {
      return { errorMessage: 'We are unable to validate your account at the moment, Try again later' };
    }
    const { status, data } = response;
    if (status) {
      const key = ACCOUNT_NUMBER_PREFIX + userId;
      const payload: BankAccountCachedPayload = {
        accountNumber: data.account_number,
        accountName: data.account_name,
        bankCode: input.bankCode,
      };
      await redis.set(key, JSON.stringify(payload), 'EX', 3600 * 24);
      return { accountName: data.account_name };
    }
    return { errorMessage: 'Invalid account number supplied, Use a valid account number' };
  }
}
