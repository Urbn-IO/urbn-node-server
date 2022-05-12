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
import {
  AppContext,
  NotificationsPayload,
  RequestInput,
  requestStatus,
} from "../types";
import { Requests } from "../entities/Requests";
import { isAuth } from "../middleware/isAuth";
import { Payments } from "../services/payments/payments";
import { Brackets, getConnection } from "typeorm";
import { GenericResponse, RequestInputs } from "../utils/graphqlTypes";
import { saveShoutout } from "../shoutOut/saveShoutOut";
import { deleteRoom } from "../utils/videoRoomManager";
import { User } from "../entities/User";
import { ValidateRecipient } from "../utils/requestValidations";
// import { NotificationsManager } from "../services/notifications/notificationsManager";
import { getFcmTokens } from "../utils/fcmTokenManager";
import { notificationsManager } from "../services/notifications/notifications";
import { typeReturn } from "../utils/helpers";

@Resolver()
export class RequestsResolver {
  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuth)
  async createRequest(
    @Arg("Input") Input: RequestInputs,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    const userId = req.session.userId as string;
    const celebId = Input.celebId;
    const celeb = await getConnection()
      .getRepository(Celebrity)
      .createQueryBuilder("celeb")
      .where("celeb.userId = :celebId", { celebId })
      .getOne();
    if (!celeb) {
      return { errorMessage: "Celebrity not found" };
    }

    const celebAlias = celeb.alias;
    const acceptShoutOut = celeb.acceptShoutOut;
    const acceptsCallTypeA = celeb.acceptsCallTypeA;
    const acceptsCallTypeB = celeb.acceptsCallTypeB;

    if (Input.requestType === "shoutout" && acceptShoutOut === false) {
      return {
        errorMessage: `${celebAlias} doesn't accept this type of request`,
      };
    }
    if (Input.requestType !== "shoutout" && acceptsCallTypeA === false) {
      return {
        errorMessage: `${celebAlias} doesn't accept this type of request`,
      };
    }
    if (Input.requestType !== "shoutout" && acceptsCallTypeB === false) {
      return {
        errorMessage: `${celebAlias} doesn't accept this type of request`,
      };
    }

    if (Input.requestType === "shoutout" && Input.description === null) {
      return { errorMessage: "Shoutout description cannot be empty" };
    }

    const user = await User.findOne({
      where: { userId },
      select: ["firstName"],
    });
    const UserfirstName = user?.firstName;
    if (Input.requestType !== "shoutout" && !Input.description) {
      Input.description = `Video call request from ${UserfirstName} to ${celebAlias}`;
    }

    const amount =
      Input.requestType === "shoutout"
        ? celeb.shoutOutRatesInNaira
        : Input.requestType === "call_type_A"
        ? celeb._3minsCallRequestRatesInNaira
        : celeb._5minsCallRequestRatesInNaira;

    const paid = new Payments().pay();
    if (!paid) {
      return { errorMessage: "Payment Error!" };
    }

    const request: RequestInput = {
      requestor: userId,
      requestorName: UserfirstName,
      recepient: celeb.userId,
      requestType: Input.requestType,
      requestAmountInNaira: amount,
      description: Input.description,
      requestExpires: Input.requestExpiration,
      recepientAlias: celebAlias,
      recepientThumbnail: celeb.thumbnail,
    };

    await Requests.create(request).save();
    const tokens = await getFcmTokens(celeb.userId);
    const requestType = Input.requestType === "shoutout" ? "shoutout" : "video";
    const message: NotificationsPayload = {
      messageTitle: `You've received a new ${requestType} request!`,
      messageBody: `Your fan ${UserfirstName}, has sent you a ${requestType} request. Check it out!`,
      tokens,
    };
    const notifications = notificationsManager(message);
    notifications.sendInstantMessage();
    return { success: "request sent" };
  }

  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuth)
  async fulfilShoutoutRequest(
    @Arg("requestId") requestId: number,
    @Arg("video") video: string,
    @Arg("thumbnail") thumbnail: string,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
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
        return { errorMessage: "Unauthorized action" };
      }
    } catch (err) {
      return { errorMessage: "Error fulfilling request, Try again later" };
    }
    return { success: "Shoutout video sent!" };
  }

  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuth)
  async fulfilCallRequest(
    @Arg("requestId") requestId: number
  ): Promise<GenericResponse> {
    try {
      deleteRoom(requestId);
      await Requests.update(
        { id: requestId },
        { status: requestStatus.FULFILLED }
      );
    } catch (err) {
      return { errorMessage: "Error fulfilling request, Try again later" };
    }
    return { success: "Request successfully fulfilled" };
  }

  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuth)
  async respondToRequest(
    @Arg("requestId") requestId: number,
    @Arg("status") status: string
  ): Promise<GenericResponse> {
    if (
      status === requestStatus.ACCEPTED ||
      status === requestStatus.REJECTED
    ) {
      try {
        const request = await typeReturn<Requests>(
          Requests.update({ id: requestId }, { status })
        );
        const requestType =
          request.requestType === "shoutout" ? "shoutout" : "video";
        const celebAlias = request.recepientAlias;
        const tokens = await getFcmTokens(request.requestor as string);
        const message: NotificationsPayload = {
          messageTitle: `Your ${requestType} request to ${celebAlias} has been ${status}`,
          messageBody: `${celebAlias} has ${status} your ${requestType} request`,
          tokens,
        };
        const notifications = notificationsManager(message);
        notifications.sendInstantMessage();
      } catch (err) {
        return {
          errorMessage: "Error changing request state, Try again later",
        };
      }
      return { success: "Request Accepted" };
    }
    return { errorMessage: "Invalid response to request" };
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
