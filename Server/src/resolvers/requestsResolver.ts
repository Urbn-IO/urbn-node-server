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
import { GenericResponse, RequestInputs } from "../utils/graphqlTypes";
import { saveShoutout } from "../shoutOut/saveShoutOut";
import { deleteRoom } from "../utils/videoRoomManager";
import { User } from "../entities/User";
import { ValidateRecipient } from "../utils/requestValidations";

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
      return { errorMessage: "Celebrity doesn't accept this type of request" };
    }
    if (Input.requestType !== "shoutout" && acceptsCallTypeA === false) {
      return { errorMessage: "Celebrity doesn't accept this type of request" };
    }
    if (Input.requestType !== "shoutout" && acceptsCallTypeB === false) {
      return { errorMessage: "Celebrity doesn't accept this type of request" };
    }

    if (Input.requestType === "shoutout" && Input.description === null) {
      return { errorMessage: "Shoutout description cannot be null" };
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
    let response;
    if (status === requestStatus.ACCEPTED) {
      response = requestStatus.ACCEPTED;
    } else if (status === requestStatus.REJECTED) {
      response = requestStatus.REJECTED;
    } else {
      return { errorMessage: "Invalid request response" };
    }
    try {
      await Requests.update({ id: requestId }, { status: response });
    } catch (err) {
      return { errorMessage: "Error changing request state, Try again later" };
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
