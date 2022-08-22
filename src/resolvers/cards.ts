import { isAuthenticated } from "../middleware/isAuthenticated";
import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  ResolverFilterData,
  Root,
  Subscription,
  UseMiddleware,
} from "type-graphql";
import { AppContext, SubscriptionTopics } from "../types";
import { CardResponse, InitializeCardResponse, NewCardVerificationResponse } from "../utils/graphqlTypes";
import { User } from "../entities/User";
import paymentManager from "../services/payments/payments";
import { CardAuthorization } from "../entities/CardAuthorization";
import { AppDataSource } from "../db";

@Resolver()
export class CardsResolver {
  @Mutation(() => InitializeCardResponse)
  @UseMiddleware(isAuthenticated)
  async addCard(@Ctx() { req }: AppContext): Promise<InitializeCardResponse> {
    let defaultCard = false;
    const userId = req.session.userId as string;
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .select(["user.email"])
      .where("user.userId = :userId", { userId })
      .leftJoinAndSelect("user.cards", "cards")
      .getOne();

    // const user = await User.findOne({ where: { userId }, select: ["email", "cards"], relations: ["cards"] });
    if (!user) return { errorMessage: "User not found" };
    if (user.cards.length < 1) defaultCard = true;
    const email = user.email;
    const amount = 50 * 100;
    const stringAmount = amount.toString();
    const result = await paymentManager().initializeCard(email, userId, stringAmount, defaultCard);
    if (!result) {
      return { errorMessage: "An error occured while adding this card. Try another card or try again later" };
    }
    return result;
  }

  @Subscription({
    topics: SubscriptionTopics.NEW_CARD,
    filter: ({ payload, context }: ResolverFilterData<NewCardVerificationResponse, any, any>) => {
      return context.userId === payload.userId;
    },
  })
  newCardVerification(@Root() verification: NewCardVerificationResponse): NewCardVerificationResponse {
    const status = verification.status;
    if (status) verification.message = "Card successfully verified";
    else verification.message = "Unable to verify this card. Please try again or try another card";
    return verification;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async setDefaultCard(@Arg("id", () => Int) id: number, @Ctx() { req }: AppContext): Promise<boolean> {
    const userId = req.session.userId;
    try {
      const user = await User.findOne({ where: { userId }, relations: ["cards"], select: ["cards"] });
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
      console.log(cards);
      await CardAuthorization.save(cards);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  @Query(() => CardResponse)
  @UseMiddleware(isAuthenticated)
  async getCards(@Ctx() { req }: AppContext): Promise<CardResponse> {
    const userId = req.session.userId;
    try {
      const user = await User.findOne({ where: { userId }, relations: { cards: true } });
      if (!user) {
        return { errorMessage: "User not found" };
      }
      const cards = user.cards;
      return { cards };
    } catch (err) {
      console.log(err);
      return { errorMessage: "An error occured" };
    }
  }
}
