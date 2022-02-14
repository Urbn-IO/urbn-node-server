import { Celebrity } from "../entities/Celebrity";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { AppContext, RequestInput } from "../types";
import { Requests } from "../entities/Requests";
import { isAuth } from "../middleware/isAuth";
import { Payments } from "../payments/payments";
import { NotificationsManager } from "../notifications/notificationsManager";
import { getConnection } from "typeorm";

@Resolver()
export class RequestsResolver {
  @Mutation(() => String)
  @UseMiddleware(isAuth)
  request(
    @Arg("requestType") requestType: string,
    @Arg("celebId") celebId: string,
    @Arg("description") description: string,
    @Arg("requestExpires") requestExpires: Date,
    @Ctx() { req }: AppContext
  ) {
    const userId = req.session.userId;
    if (!userId) {
      return "user is not logged in";
    }
    return requestType === ("video" || "call")
      ? this.initiateRequest(
          celebId,
          requestType,
          userId,
          description,
          requestExpires
        )
      : "Error: Invalid request type";
  }

  async initiateRequest(
    id: string,
    type: string,
    userId: string,
    description: string,
    requestExpires: Date
  ) {
    const celeb = await Celebrity.findOne(id);
    if (!celeb) {
      return "Invalid celebrity Id";
    }
    const paid = new Payments().pay();
    if (!paid) {
      return "transaction failed";
    }

    const celebAliasObj = await getConnection().query(
      `select alias from Celebrity where id = ${id}`
    );

    const celebAlias = celebAliasObj[0].alias;
    const amount =
      type === "video"
        ? celeb.videoRequestRatesInNaira
        : celeb.callRequestRatesInNaira;
    const request: RequestInput = {
      requestor: userId,
      recepient: celeb.userId,
      requestType: type,
      requestAmountInNaira: amount,
      description: description,
      requestExpires,
      recepientAlias: celebAlias,
    };

    await Requests.create(request).save();
    const notifications = new NotificationsManager();

    const result = await notifications.sendNotifications(
      celeb.userId,
      userId,
      type,
      false,
      celebAlias
    );
    // await sendRequest

    return result;
  }
}
