import crypto from "crypto";
import { s3SecondaryClient } from "../services/aws/clients/s3Client";
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
  contentType,
  notificationRouteCode,
  RequestInput,
  requestStatus,
} from "../types";
import { Requests } from "../entities/Requests";
import { isAuth } from "../middleware/isAuth";
import { Payments } from "../services/payments/payments";
import { Brackets, getConnection } from "typeorm";
import {
  GenericResponse,
  RequestInputs,
  videoUploadData,
} from "../utils/graphqlTypes";
import { deleteRoom } from "../utils/videoRoomManager";
import { User } from "../entities/User";
import { ValidateShoutoutRecipient } from "../utils/requestValidations";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendPushNotification } from "../services/notifications/handler";

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
    if (
      Input.requestType !== "shoutout" &&
      Input.requestType === "call_type_A" &&
      acceptsCallTypeA === false
    ) {
      return {
        errorMessage: `${celebAlias} doesn't accept this type of request`,
      };
    } else if (
      Input.requestType !== "shoutout" &&
      Input.requestType === "call_type_B" &&
      acceptsCallTypeB === false
    ) {
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
    const requestType =
      Input.requestType === "shoutout" ? "shoutout" : "video call";
    sendPushNotification(
      [celeb.userId],
      "New Request Alert",
      `You have received a new ${requestType} request`,
      notificationRouteCode.RECEIVED_REQUEST
    );
    return { success: "Request Sent!" };
  }

  @Mutation(() => videoUploadData)
  @UseMiddleware(isAuth)
  async fulfilShoutoutRequest(
    @Arg("requestId", () => Int) requestId: number,
    @Ctx() { req }: AppContext
  ): Promise<videoUploadData> {
    const userId = req.session.userId as string; //
    const bucketName = process.env.AWS_BUCKET_NAME;
    try {
      const request = await ValidateShoutoutRecipient(userId, requestId);
      if (request) {
        const owner = request.requestor;
        const celebAlias = request.recepientAlias;
        const time = Math.floor(new Date().getTime() / 1000);
        const randomNumber = Math.random().toString();
        const id = crypto
          .createHash("md5")
          .update(time + randomNumber)
          .digest("hex");
        const videoKey = `${owner}-${time}-${id}`;
        const metadataKey = `${owner}-${time}-${id}.json`;
        const keys = [videoKey, metadataKey];
        const urls = keys.map(async (key) => {
          const s3Command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
          });
          const signedUrl = await getSignedUrl(s3SecondaryClient, s3Command, {
            expiresIn: 3600,
          });
          return signedUrl;
        });

        return {
          videoData: {
            videoUrl: await urls[0],
            metadataUrl: await urls[1],
            metadata: {
              srcVideo: videoKey,
              customMetadata: {
                contentType: contentType.SHOUTOUT,
                userId,
                alias: celebAlias,
                requestId: requestId,
                owner: request.requestor,
              },
            },
          },
        };
      } else {
        return { errorMessage: "Unauthorized action" };
      }
    } catch (err) {
      return { errorMessage: "Error fulfilling request, Try again later" };
    }
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
        // const request = await typeReturn<Requests>(
        //   Requests.update({ id: requestId }, { status })
        // );
        const request = await (
          await Requests.createQueryBuilder()
            .update({ status })
            .where({ id: requestId })
            .returning('requestor, "requestType", "recepientAlias"')
            .execute()
        ).raw[0];
        const requestType =
          request.requestType === "shoutout" ? "shoutout" : "video call";
        const celebAlias = request.recepientAlias;
        sendPushNotification(
          [request.requestor],
          "Response Alert",
          `Your ${requestType} request to ${celebAlias} has been ${status}`,
          notificationRouteCode.RESPONSE
        );
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
  async sentRequests(
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
  async receivedRequests(
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
  async acceptedRequests(
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
