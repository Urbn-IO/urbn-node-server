import { Celebrity } from "../entities/Celebrity";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { AppContext, RequestInput, requestStatus } from "../types";
import { Requests } from "../entities/Requests";
import { isAuth } from "../middleware/isAuth";
import { Payments } from "../payments/payments";
import { NotificationsManager } from "../notifications/notificationsManager";
import { getConnection } from "typeorm";
import { genericResponse } from "../utils/graphqlTypes";
import { saveShoutOut } from "../shoutOut/saveShoutOut";

@Resolver()
export class RequestsResolver {
  @Mutation(() => genericResponse)
  @UseMiddleware(isAuth)
  async request(
    @Arg("requestType") requestType: string,
    @Arg("celebId") celebId: string,
    @Arg("description") description: string,
    @Arg("requestExpires") requestExpires: Date,
    @Ctx() { req }: AppContext
  ): Promise<genericResponse> {
    const userId = req.session.userId;
    if (!userId) {
      return { success: "user is not logged in" };
    }
    return requestType === ("video" || "callTypeA" || "callTypeB")
      ? this.initiateRequest(
          celebId,
          requestType,
          userId,
          description,
          requestExpires
        )
      : {
          errors: [
            {
              errorMessage: "Invalid request type",
              field: "requestType",
            },
          ],
        };
  }

  async initiateRequest(
    celebId: string,
    type: string,
    userId: string,
    description: string,
    requestExpires: Date
  ): Promise<genericResponse> {
    const celeb = await getConnection()
      .getRepository(Celebrity)
      .createQueryBuilder("celeb")
      .where("celeb.userId = :celebId", { celebId })
      .getOne();
    if (!celeb) {
      return {
        errors: [
          {
            errorMessage: "Invalid celebrity Id",
            field: "celebId",
          },
        ],
      };
    }

    const celebAlias = celeb.alias;
    const acceptShoutOut = celeb.acceptShoutOut;
    const acceptsCallRequests = celeb.acceptsCalls;

    if (type === "video" && acceptShoutOut === false) {
      return {
        errors: [
          {
            errorMessage: "Celebrity doesn't accept this type of request",
            field: "requestType",
          },
        ],
      };
    }
    if (type !== "video" && acceptsCallRequests === false) {
      return {
        errors: [
          {
            errorMessage: "Celebrity doesn't accept this type of request",
            field: "requestType",
          },
        ],
      };
    }

    const amount =
      type === "video"
        ? celeb.shoutOutRatesInNaira
        : type === "callTypeA"
        ? celeb._3minsCallRequestRatesInNaira
        : celeb._5minsCallRequestRatesInNaira;

    const paid = new Payments().pay();
    if (!paid) {
      return {
        errors: [{ errorMessage: "Payment Error!", field: "" }],
      };
    }

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

  @Mutation(() => genericResponse)
  @UseMiddleware(isAuth)
  async fulfilRequest(
    @Arg("requestId") requestId: number,
    @Arg("videoUrl") videoUrl: string,
    @Arg("thumbNailUrl") thumbNailUrl: string,
    @Arg("ownerId") ownedBy: string,
    @Ctx() { req }: AppContext
  ): Promise<genericResponse> {
    const userId = req.session.userId;
    try {
      await saveShoutOut(videoUrl, thumbNailUrl, ownedBy, userId);
      await Requests.update(
        { id: requestId },
        { status: requestStatus.FULFILLED }
      );
    } catch (err) {
      return {
        errors: [
          {
            errorMessage: "Error fulfilling request, Try again later",
            field: "",
          },
        ],
      };
    }
    return { success: "Hurray! You've made someone's day!" };
  }
}
