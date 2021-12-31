import { Celebrity } from "../entities/Celebrity";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { AppContext, RequestInput } from "../types";
import { Requests } from "../entities/Requests";
import { isAuth } from "../middleware/isAuth";
import { Payments } from "../payments/Payments";

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
    return requestType === "video"
      ? this.initiateRequest(
          celebId,
          "video",
          userId,
          description,
          requestExpires
        )
      : requestType === "call"
      ? this.initiateRequest(
          celebId,
          "call",
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
    // await sendRequest

    return `${type} request sent to celebrity`;
  }
}
