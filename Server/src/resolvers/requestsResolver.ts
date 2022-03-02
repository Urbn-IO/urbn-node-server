import { Celebrity } from "../entities/Celebrity";
import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { AppContext, RequestInput, requestStatus } from "../types";
import { Requests } from "../entities/Requests";
import { isAuth } from "../middleware/isAuth";
import { Payments } from "../payments/payments";
import { NotificationsManager } from "../notifications/notificationsManager";
import { Brackets, getConnection } from "typeorm";
import { genericResponse } from "../utils/graphqlTypes";
import { saveShoutout } from "../shoutOut/saveShoutOut";
import { deleteCallToken } from "../calls/callTokenManager";
import { User } from "../entities/User";

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
    const types = ["video", "callTypeA", "callTypeB"];
    if (!userId) {
      return { success: "user is not logged in" };
    }

    if (!types.includes(requestType)) {
      return {
        errors: [
          {
            errorMessage: "Invalid request type",
            field: "requestType",
          },
        ],
      };
    }

    return this.initiateRequest(
      celebId,
      requestType,
      userId,
      description,
      requestExpires
    );
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

    const user = await User.findOne({
      where: { userId },
      select: ["firstName"],
    });
    const userName = user?.firstName;

    const request: RequestInput = {
      requestor: userId,
      requestorName: userName,
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
  async fulfilVideoRequest(
    @Arg("requestId") requestId: number,
    @Arg("video") videoUrl: string,
    @Arg("thumbNail") thumbNailUrl: string,
    @Arg("ownerId") ownedBy: string,
    @Ctx() { req }: AppContext
  ): Promise<genericResponse> {
    const userId = req.session.userId;
    try {
      await saveShoutout(videoUrl, thumbNailUrl, ownedBy, userId);
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

  @Mutation(() => genericResponse)
  @UseMiddleware(isAuth)
  async fulfilCallRequest(
    @Arg("requestId") requestId: number,
    @Arg("callToken") callToken: string
  ): Promise<genericResponse> {
    try {
      deleteCallToken(callToken);
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
    return { success: "Request successfully fulfilled" };
  }

  @Mutation(() => genericResponse)
  @UseMiddleware(isAuth)
  async respondToRequest(
    @Arg("requestId") requestId: number,
    @Arg("status") status: string
  ): Promise<genericResponse> {
    let response;
    if (status === requestStatus.ACCEPTED) {
      response = requestStatus.ACCEPTED;
    } else if (status === requestStatus.REJECTED) {
      response = requestStatus.REJECTED;
    } else {
      return {
        errors: [{ errorMessage: "Invalid request response", field: "status" }],
      };
    }
    try {
      await Requests.update({ id: requestId }, { status: response });
    } catch (err) {
      return {
        errors: [
          {
            errorMessage: "Error changing request state, Try again later",
            field: "",
          },
        ],
      };
    }
    return { success: "Request Accepted" };
  }

  @Query(() => [Requests])
  @UseMiddleware(isAuth)
  async SentRequests(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: AppContext
  ) {
    const userId = req.session.userId;
    const maxLimit = Math.min(9, limit);
    const queryBuilder = getConnection()
      .getRepository(Requests)
      .createQueryBuilder("requests")
      .where("requests.requestor = :userId", { userId })
      .orderBy("requests.updatedAt", "DESC")
      .take(maxLimit);

    if (cursor) {
      queryBuilder.andWhere('requests."updatedAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }
    const requests = await queryBuilder.getMany();
    return requests;
  }

  @Query(() => [Requests])
  @UseMiddleware(isAuth)
  async ReceivedRequests(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: AppContext
  ) {
    const userId = req.session.userId;
    const maxLimit = Math.min(9, limit);
    const status = requestStatus.PENDING;
    const queryBuilder = getConnection()
      .getRepository(Requests)
      .createQueryBuilder("requests")
      .where("requests.recepient = :userId", { userId })
      .andWhere("requests.status = :status", { status })
      .orderBy("requests.updatedAt", "DESC")
      .take(maxLimit);

    if (cursor) {
      queryBuilder.andWhere('requests."updatedAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    const requests = await queryBuilder.getMany();
    return requests;
  }

  @Query(() => [Requests])
  @UseMiddleware(isAuth)
  async AcceptedRequests(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: AppContext
  ) {
    const userId = req.session.userId;
    const maxLimit = Math.min(9, limit);
    const status = requestStatus.ACCEPTED;
    const queryBuilder = getConnection()
      .getRepository(Requests)
      .createQueryBuilder("requests")
      .where(
        new Brackets((qb) => {
          qb.where("requests.recepient = :userId", { userId }).orWhere(
            "requests.requestor = :userId",
            { userId }
          );
        })
      )
      .andWhere("requests.status = :status", { status })
      .orderBy("requests.updatedAt", "DESC")
      .take(maxLimit);

    if (cursor) {
      queryBuilder.andWhere('requests."updatedAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    const requests = await queryBuilder.getMany();
    return requests;
  }
}
