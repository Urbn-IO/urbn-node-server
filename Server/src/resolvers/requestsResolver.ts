import { Celebrity } from "../entities/Celebrity";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { AppContext, RequestInput } from "../types";
import { Requests } from "../entities/Requests";
import { isAuth } from "../middleware/isAuth";
import { Payments } from "../payments/Payments";
import { notificationsManager } from "../notifications/notificationsManager";

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
    userId: string | undefined,
    description: string,
    requestExpires: Date
  ) {
    if (!userId) {
      return "user is not logged in";
    }
    const celeb = await Celebrity.findOne(id);
    if (!celeb) {
      return "Invalid celebrity Id";
    }
    const paid = new Payments().pay();
    if (!paid) {
      return "transaction failed";
    }

    const amount =
      type === "video"
        ? celeb.videoRequestRatesInNaira
        : celeb.callRequestRatesInNaira;
    const request: RequestInput = {
      requester: userId,
      recepient: celeb.userId,
      requestType: type,
      requestAmountInNaira: amount,
      description: description,
      requestExpires,
    };

    await Requests.create(request).save();
    const notifications = new notificationsManager();

    const result = await notifications.sendNotifications(
      celeb.userId,
      userId,
      type
    );
    // await sendRequest

    return result;
  }
}
