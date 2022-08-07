import { isAuthenticated } from "../middleware/isAuthenticated";
import { Ctx, Mutation, Query, Resolver, ResolverFilterData, Root, Subscription, UseMiddleware } from "type-graphql";
import { AppContext, EmailBaseInput, EmailTemplates, SubscriptionTopics } from "../types";
import { CardResponse, InitializeCardResponse, NewCardVerificationResponse } from "../utils/graphqlTypes";
import { CardAuthorization } from "../entities/CardAuthorization";
import { User } from "../entities/User";
import paymentManager from "../services/payments/payments";

import sendMail from "../services/mail/sendMail";

@Resolver()
export class PaymentsResolver {
  @Mutation(() => InitializeCardResponse)
  @UseMiddleware(isAuthenticated)
  async addCard(@Ctx() { req }: AppContext): Promise<InitializeCardResponse> {
    const userId = req.session.userId as string;
    const user = await User.findOne({ where: { userId }, select: ["email"] });
    if (!user) {
      return { errorMessage: "User not found" };
    }
    const email = user.email;
    const amount = 50 * 100;
    const stringAmount = amount.toString();
    const result = await paymentManager().initializeCard(email, userId, stringAmount);
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

  // @Mutation(() => Boolean)
  // @UseMiddleware(isAuthenticated)
  // async verifyNewCard(@Arg("ref") ref: string) {
  //   const result = await paymentManager().verifyPayment(ref, true);
  //   return result;
  // }

  // @Mutation(() => String)
  // @UseMiddleware(isAuthenticated)
  // async payWithCard(@Arg("cardId") id: string, @Arg("amount") amount: string) {
  //   const card = await CardAuthorization.findOne(id);
  //   if (!card) {
  //     return "There was an error while processing your payment! Try again with another card";
  //   }
  //   const email = card.email;
  //   const authCode = card.authorizationCode;
  //   const response = await chargePayment(email, amount, authCode);
  //   return response;
  // }

  @Query(() => CardResponse)
  @UseMiddleware(isAuthenticated)
  async getCards(@Ctx() { req }: AppContext): Promise<CardResponse> {
    const userId = req.session.userId;
    const user = await User.findOne({ where: { userId: userId } });
    if (!user) {
      return { errorMessage: "User not found" };
    }
    const cards = await CardAuthorization.find({ where: { user } });

    if (!cards) {
      return { errorMessage: "User has no cards" };
    }
    return { cards };
  }

  @Query(() => Boolean)
  async sendEmailTest() {
    // const testAccount = await nodemailer.createTestAccount();
    // console.log("testAccount", testAccount);
    const year = new Date().getFullYear().toString();
    const data: EmailBaseInput = {
      name: "Nnamdi",
      logo: "https://d3p19n9yrlubzc.cloudfront.net/Assets/Urbn.png",
      year,
      link: "https://google.com",
      contact: "mailto:nnamdi@geturbn.io",
    };
    sendMail("nnamdi@geturbn.io", EmailTemplates.ConfirmEmailTemplate, ["ogbunnamdi@gmail.com"], data);
    return true;
  }
}
