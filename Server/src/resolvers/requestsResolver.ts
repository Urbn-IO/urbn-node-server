import { Celebrity } from "../entities/Celebrity";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { AppContext, RequestInput } from "../types";
import { Requests } from "../entities/Requests";
import { isAuth } from "../middleware/isAuth";

@Resolver()
export class RequestsResolver {
  @Mutation(() => String)
  @UseMiddleware(isAuth)
  request(
    @Arg("requestType") requestType: string,
    @Arg("celebUserId") celebId: string,
    @Ctx() { req }: AppContext
  ) {
    const userId = req.session.userId;
    return requestType === "video"
      ? this.initiateRequest(celebId, "video", userId)
      : requestType === "call"
      ? this.initiateRequest(celebId, "call", userId)
      : "Error: Invalid request type";
  }

  async initiateRequest(id: string, type: string, userId: string | undefined) {
    const celeb = await Celebrity.findOne(id);
    if (!celeb) {
      return "Invalid celebrity Id";
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
    };
    await Requests.create(request).save();

    return `${type} request sent to celebrity`;
  }
}
