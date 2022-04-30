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
import { Payments } from "../services/payments/payments";
import { NotificationsManager } from "../notifications/notificationsManager";
import { Brackets, getConnection } from "typeorm";
import { genericResponse, RequestInputs } from "../utils/graphqlTypes";
import { saveShoutout } from "../shoutOut/saveShoutOut";
import { deleteRoom } from "../utils/videoRoomManager";
import { User } from "../entities/User";
import { ValidateRecipient } from "../utils/requestValidations";

@Resolver()
export class RequestsResolver {
  @Mutation(() => genericResponse)
  @UseMiddleware(isAuth)
  async createRequest(
    @Arg("Input") Input: RequestInputs,
    @Ctx() { req }: AppContext
  ): Promise<genericResponse> {
    const userId = req.session.userId as string;
    const celebId = Input.celebId;
    const celeb = await getConnection()
      .getRepository(Celebrity)
      .createQueryBuilder("celeb")
      .where("celeb.userId = :celebId", { celebId })
      .getOne();
    if (!celeb) {
      return {
        errors: [
          {
            errorMessage: "Celebrity not found",
            field: "celebId",
          },
        ],
      };
    }

    const celebAlias = celeb.alias;
    const acceptShoutOut = celeb.acceptShoutOut;
    const acceptsCallRequests = celeb.acceptsCalls;

    if (Input.requestType === "shoutout" && acceptShoutOut === false) {
      return {
        errors: [
          {
            errorMessage: "Celebrity doesn't accept this type of request",
            field: "requestType",
          },
        ],
      };
    }
    if (Input.requestType !== "shoutout" && acceptsCallRequests === false) {
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
      Input.requestType === "shoutout"
        ? celeb.shoutOutRatesInNaira
        : Input.requestType === "call_type_A"
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
      requestType: Input.requestType,
      requestAmountInNaira: amount,
      description: Input.description,
      requestExpires: Input.requestExpiration,
      recepientAlias: celebAlias,
      recepientThumbnail: celeb.thumbnail,
    };

    await Requests.create(request).save();
    const notifications = new NotificationsManager();

    const result = await notifications.sendNotifications(
      celeb.userId,
      userId,
      Input.requestType,
      false,
      celebAlias
    );
    // await sendRequest
    return result;
  }

  @Mutation(() => genericResponse)
  @UseMiddleware(isAuth)
  async fulfilShoutoutRequest(
    @Arg("requestId") requestId: number,
    @Arg("video") video: string,
    @Arg("thumbnail") thumbnail: string,
    @Ctx() { req }: AppContext
  ): Promise<genericResponse> {
    const userId = req.session.userId as string; //
    try {
      const isValidCeleb = await ValidateRecipient(userId, requestId);
      if (isValidCeleb) {
        const request = await Requests.findOne({
          where: { id: requestId },
          select: ["requestor"],
        });
        await saveShoutout(
          video,
          thumbnail,
          request?.requestor as string,
          userId
        );
        await Requests.update(
          { id: requestId },
          { status: requestStatus.FULFILLED }
        );
      } else {
        return {
          errors: [
            {
              errorMessage: "Unauthorized action",
              field: "",
            },
          ],
        };
      }
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
    return { success: "Shoutout video sent!" };
  }

  @Mutation(() => genericResponse)
  @UseMiddleware(isAuth)
  async fulfilCallRequest(
    @Arg("requestId") requestId: number
  ): Promise<genericResponse> {
    try {
      deleteRoom(requestId);
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
