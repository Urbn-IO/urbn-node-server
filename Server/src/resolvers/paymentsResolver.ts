import { chargePayment, initializePayment } from "../api/payments";
import { isAuth } from "../middleware/isAuth";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { AppContext } from "../types";
import { CardResponse } from "../utils/graphqlTypes";
import { CardAuthorization } from "../entities/CardAuthorization";
import { User } from "../entities/User";

@Resolver()
export class PaymentsResolver {
  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async initPayment(
    @Arg("email") email: string,
    @Arg("amount") amount: string,
    @Ctx() { req }: AppContext
  ) {
    const convertedAmount = parseInt(amount) * 100;
    const convertedAmountString = convertedAmount.toString();
    const userId = req.session.userId;
    if (!userId) {
      return "User not Logged In";
    }
    const data = await initializePayment(email, userId, convertedAmountString);
    return data;
  }

  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async payWithCard(@Arg("cardId") id: string, @Arg("amount") amount: string) {
    const card = await CardAuthorization.findOne(id);
    if (!card) {
      return "There was an error while processing your payment! Try again with another card";
    }
    const email = card.email;
    const authCode = card.authorizationCode;
    const response = await chargePayment(email, amount, authCode);
    return response;
  }

  @Query(() => CardResponse)
  @UseMiddleware(isAuth)
  async getCards(@Ctx() { req }: AppContext): Promise<CardResponse> {
    const userId = req.session.userId;
    const user = await User.findOne({ where: { userId: userId } });
    if (!user) {
      return {
        errors: [
          {
            field: "",
            errorMessage: "User not found",
          },
        ],
      };
    }
    const cards = await CardAuthorization.find({ where: { user } });

    if (!cards) {
      return {
        errors: [
          {
            field: "",
            errorMessage: "User has no cards",
          },
        ],
      };
    }
    return { cards };
  }
}
