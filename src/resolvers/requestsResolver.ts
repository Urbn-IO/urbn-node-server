import crypto from "crypto";
import { s3SecondaryClient } from "../services/aws/clients/s3Client";
import { Celebrity } from "../entities/Celebrity";
import { Arg, Ctx, Int, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { AppContext, CallType, ContentType, NotificationRouteCode, RequestStatus, RequestType } from "../types";
import { Requests } from "../entities/Requests";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { Payments } from "../services/payments/payments";
import { Brackets, getConnection } from "typeorm";
import { GenericResponse, ShoutoutRequestInput, VideoCallRequestInputs, videoUploadData } from "../utils/graphqlTypes";
import { User } from "../entities/User";
import { ValidateRecipient } from "../utils/requestValidations";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendPushNotification } from "../services/notifications/handler";
import { appendCdnLink } from "../utils/cdnHelper";
import { CallScheduleBase } from "../entities/CallScheduleBase";
import { getNextAvailableDate } from "../utils/helpers";
import { deleteRoom } from "../services/video/videoRoomManager";

@Resolver()
export class RequestsResolver {
  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuthenticated)
  async createShoutoutRequest(
    @Arg("Input") Input: ShoutoutRequestInput,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    const userId = req.session.userId as string;
    if (Input.description.length > 300 || Input.description.length < 11) {
      return {
        errorMessage: "Invalid description length",
      };
    }
    const celebId = Input.celebId;
    const celeb = await Celebrity.findOne(celebId);
    if (!celeb) return { errorMessage: "We cannot find this celebrity" };
    // if (celeb.userId === userId) return { errorMessage: "You cannot make a request to yourself" };
    const celebAlias = celeb.alias;
    const acceptsShoutOut = celeb.acceptShoutOut;
    const celebThumbnail = appendCdnLink(celeb.thumbnail);
    if (acceptsShoutOut === false) return { errorMessage: `Sorry! ${celebAlias} doesn't currently accept shoutouts` };
    const user = await User.findOne({
      where: { userId },
      select: ["firstName"],
    });
    const requestorName = user?.firstName;
    const transactionAmount = celeb.shoutOutRatesInNaira;
    const paid = new Payments().pay();
    if (!paid) return { errorMessage: "Payment Error!" };
    const request = {
      requestor: userId,
      requestorName,
      recepient: celeb.userId,
      requestAmountInNaira: transactionAmount,
      description: Input.description,
      requestExpires: Input.requestExpiration,
      recepientAlias: celebAlias,
      recepientThumbnail: celebThumbnail,
    };
    const save = await Requests.create(request).save();
    if (save) {
      sendPushNotification(
        [celeb.userId],
        "New Request Alert",
        "You have received a new shoutout request",
        NotificationRouteCode.RECEIVED_REQUEST
      );
      return { success: "Request Sent!" };
    }
    return { errorMessage: "Failed to create your request at this time. Try again later" };
  }

  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuthenticated)
  async createVideoCallRequest(
    @Arg("Input") Input: VideoCallRequestInputs,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    const userId = req.session.userId as string;
    const celebId = Input.celebId;
    const celeb = await Celebrity.findOne(celebId);
    if (!celeb) return { errorMessage: "We cannot find this celebrity" };
    if (celeb.userId === userId) return { errorMessage: "You cannot make a request to yourself" };
    const celebAlias = celeb.alias;
    const celebThumbnail = appendCdnLink(celeb.thumbnail);
    const acceptsCallTypeA = celeb.acceptsCallTypeA;
    const acceptsCallTypeB = celeb.acceptsCallTypeB;
    let callRequestType;
    let callDurationInSeconds;
    if (acceptsCallTypeA === true && Input.callType === CallType.CALL_TYPE_A) {
      callRequestType = RequestType.CALL_TYPE_A;
      callDurationInSeconds = 190;
    } else if (acceptsCallTypeB === true && Input.callType === CallType.CALL_TYPE_B) {
      callRequestType = RequestType.CALL_TYPE_B;
      callDurationInSeconds = 310;
    } else return { errorMessage: `Sorry! ${celebAlias} doesn't currently accept this type of request` };
    const CallScheduleRepo = getConnection().getTreeRepository(CallScheduleBase);
    const availableSlot = await CallScheduleRepo.findOne(Input.selectedTimeSlotId);
    if (!availableSlot || availableSlot.available === (false || null)) {
      return {
        errorMessage: "The selected time slot is no longer available, please select another time for this call",
      };
    }

    const paid = new Payments().pay();
    if (!paid) return { errorMessage: "Payment Error!" };
    const user = await User.findOne({
      where: { userId },
      select: ["firstName"],
    });
    const UserfirstName = user?.firstName;
    const transactionAmount = celeb.shoutOutRatesInNaira;
    const availabeDate = getNextAvailableDate(availableSlot.day as number);
    const startTime = availableSlot.startTime as unknown as string;
    const startTimeSplit = startTime.split(":");
    const availableDay = availabeDate
      .set("hour", parseInt(startTimeSplit[0]))
      .set("minute", parseInt(startTimeSplit[1]))
      .set("second", parseInt(startTimeSplit[2]));

    const callRequestBegins = availableDay;
    const requestExpires = availableDay.add(5, "minute");

    const request = {
      requestor: userId,
      requestorName: UserfirstName,
      recepient: celeb.userId,
      requestType: callRequestType,
      requestAmountInNaira: transactionAmount,
      description: `Video call request from ${UserfirstName} to ${celebAlias}`,
      callScheduleId: availableSlot.id,
      callDurationInSeconds,
      callRequestBegins,
      requestExpires,
      recepientAlias: celebAlias,
      recepientThumbnail: celebThumbnail,
    };
    const save = await Requests.create(request).save();
    if (save) {
      CallScheduleRepo.update(availableSlot.id, { available: false });
      sendPushNotification(
        [celeb.userId],
        "New Request Alert",
        "You have received a new video call request",
        NotificationRouteCode.RECEIVED_REQUEST
      );
      return { success: "Request Sent!" };
    }
    return { errorMessage: "Failed to create your request at this time. Try again later" };
  }

  @Mutation(() => videoUploadData)
  @UseMiddleware(isAuthenticated)
  async fulfilShoutoutRequest(
    @Arg("requestId", () => Int) requestId: number,
    @Ctx() { req }: AppContext
  ): Promise<videoUploadData> {
    const userId = req.session.userId as string; //
    const bucketName = process.env.AWS_BUCKET_NAME;
    try {
      const request = await ValidateRecipient(userId, requestId);
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
                contentType: ContentType.SHOUTOUT,
                userId,
                alias: celebAlias,
                requestId: requestId,
                owner,
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
  @UseMiddleware(isAuthenticated)
  async fulfilCallRequest(@Arg("requestId") requestId: number): Promise<GenericResponse> {
    try {
      deleteRoom(requestId);
      const request = await (
        await Requests.createQueryBuilder()
          .update({ status: RequestStatus.FULFILLED })
          .where({ id: requestId })
          .returning('"callScheduleId"')
          .execute()
      ).raw[0];
      const callScheduleTreeRepo = getConnection().getTreeRepository(CallScheduleBase);
      await callScheduleTreeRepo.update(request.callScheduleId, { available: true });
    } catch (err) {
      return { errorMessage: "Error fulfilling request, Try again later" };
    }
    return { success: "Request successfully fulfilled" };
  }

  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuthenticated)
  async respondToRequest(@Arg("requestId") requestId: number, @Arg("status") status: string): Promise<GenericResponse> {
    if (status === RequestStatus.ACCEPTED || status === RequestStatus.REJECTED) {
      try {
        const request = await (
          await Requests.createQueryBuilder()
            .update({ status })
            .where({ id: requestId })
            .returning('requestor, "requestType", "recepientAlias"')
            .execute()
        ).raw[0];
        const requestType = request.requestType === "shoutout" ? "shoutout" : "video call";
        const celebAlias = request.recepientAlias;
        sendPushNotification(
          [request.requestor],
          "Response Alert",
          `Your ${requestType} request to ${celebAlias} has been ${status}`,
          NotificationRouteCode.RESPONSE
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
  @UseMiddleware(isAuthenticated)
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
      .orderBy("requests.createdAt", "DESC")
      .take(maxLimit);

    if (cursor) {
      queryBuilder.andWhere('requests."createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }
    const requests = await queryBuilder.getMany();
    return requests;
  }

  @Query(() => [Requests])
  @UseMiddleware(isAuthenticated)
  async receivedRequests(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: AppContext
  ) {
    const userId = req.session.userId;
    const maxLimit = Math.min(9, limit);
    const status = RequestStatus.PENDING;
    const queryBuilder = getConnection()
      .getRepository(Requests)
      .createQueryBuilder("requests")
      .where("requests.recepient = :userId", { userId })
      .andWhere("requests.status = :status", { status })
      .orderBy("requests.createdAt", "DESC")
      .take(maxLimit);

    if (cursor) {
      queryBuilder.andWhere('requests."createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    const requests = await queryBuilder.getMany();
    return requests;
  }

  @Query(() => [Requests])
  @UseMiddleware(isAuthenticated)
  async acceptedRequests(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: AppContext
  ) {
    const userId = req.session.userId;
    const maxLimit = Math.min(9, limit);
    const status = RequestStatus.ACCEPTED;
    const queryBuilder = getConnection()
      .getRepository(Requests)
      .createQueryBuilder("requests")
      .where(
        new Brackets((qb) => {
          qb.where("requests.recepient = :userId", { userId }).orWhere("requests.requestor = :userId", { userId });
        })
      )
      .andWhere("requests.status = :status", { status })
      .orderBy("requests.createdAt", "DESC")
      .take(maxLimit);

    if (cursor) {
      queryBuilder.andWhere('requests."createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    const requests = await queryBuilder.getMany();
    return requests;
  }
}
