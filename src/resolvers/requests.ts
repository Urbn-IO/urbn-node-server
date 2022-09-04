import crypto from "crypto";
import { s3SecondaryClient } from "../services/aws/clients/s3/client";
import { Celebrity } from "../entities/Celebrity";
import { Arg, Ctx, Int, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { AppContext, CallType, ContentType, NotificationRouteCode, RequestStatus, RequestType } from "../types";
import { Requests } from "../entities/Requests";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { Brackets } from "typeorm";
import { GenericResponse, ShoutoutRequestInput, VideoCallRequestInputs, VideoUploadData } from "../utils/graphqlTypes";
import { User } from "../entities/User";
import { validateRecipient } from "../utils/requestValidations";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendInstantNotification } from "../services/notifications/handler";
import { appendCdnLink } from "../utils/cdnHelper";
import { CallScheduleBase } from "../entities/CallScheduleBase";
import { getNextAvailableDate } from "../utils/helpers";
import paymentManager from "../services/payments/payments";
import createhashString from "../utils/createHashString";
import { AppDataSource } from "../db";
import { INSTANT_SHOUTOUT_RATE, VIDEO_CALL_TYPE_A_DURATION, VIDEO_CALL_TYPE_B_DURATION } from "../constants";

@Resolver()
export class RequestsResolver {
  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuthenticated)
  async createShoutoutRequest(
    @Arg("Input") Input: ShoutoutRequestInput,
    @Arg("cardId", () => Int) cardId: number,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    const userId = req.session.userId as string;
    const celebId = Input.celebId;
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .select(["user.email", "user.displayName"])
      .leftJoin("user.cards", "cards")
      .where("cards.id = :cardId", { cardId })
      .addSelect(["cards.authorizationCode"])
      .getRawOne();

    if (!user) return { errorMessage: "We don't have this card anymore, try adding it again or try another" };

    const email = user.user_email;
    const requestorName = user.user_displayName;
    const cardAuth = user.authorizationCode;

    const celeb = await Celebrity.findOne({ where: { id: celebId } });
    if (!celeb) return { errorMessage: "This celebrity is no longer available" };
    if (celeb.userId === userId) return { errorMessage: "You cannot make a request to yourself" };
    const celebAlias = celeb.alias;
    const acceptsShoutOut = celeb.acceptsShoutout;
    const acceptsInstantShoutOut = celeb.acceptsInstantShoutout;
    const celebThumbnail = appendCdnLink(celeb.thumbnail);
    if (acceptsShoutOut === false) return { errorMessage: `Sorry! ${celebAlias} doesn't currently accept shoutouts` };
    if (acceptsInstantShoutOut === false && Input.instantShoutout === true) {
      return { errorMessage: `Sorry! ${celebAlias} doesn't currently accept instant shoutouts` };
    }
    const requestType = Input.instantShoutout ? RequestType.INSTANT_SHOUTOUT : RequestType.SHOUTOUT;
    const transactionAmount = Input.instantShoutout
      ? (celeb.shoutout * 100 * INSTANT_SHOUTOUT_RATE).toString()
      : (celeb.shoutout * 100).toString();
    const ref = createhashString([email, userId, celeb.id]);
    const chargePayment = await paymentManager().chargeCard(email, transactionAmount, cardAuth, ref, {
      userId,
      recipient: celeb.userId,
    });
    if (chargePayment) {
      const request = {
        requestor: userId,
        requestorName,
        recipient: celeb.userId,
        requestType,
        amount: transactionAmount,
        description: Input.description,
        requestExpires: Input.requestExpiration,
        recipientAlias: celebAlias,
        recipientThumbnail: celebThumbnail,
        paymentRef: ref,
      };
      const result = await Requests.create(request as Requests).save();
      if (result) {
        return { success: "Request Sent!" };
      }
    } else return { errorMessage: "Payment Error! Try again" };

    return { errorMessage: "Failed to create your request at this time. Try again later" };
  }

  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuthenticated)
  async createVideoCallRequest(
    @Arg("Input") Input: VideoCallRequestInputs,
    @Arg("cardId", () => Int) cardId: number,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    let callRequestType;
    let callDurationInSeconds;
    const userId = req.session.userId as string;
    const celebId = Input.celebId;
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .select(["user.displayName", "user.email"])
      .leftJoin("user.cards", "cards")
      .where("cards.id = :cardId", { cardId })
      .addSelect(['cards."authorizationCode"'])
      .getRawOne();

    if (!user) return { errorMessage: "We don't have this card anymore, try adding it again or try another" };

    const email = user.user_email;
    const requestorName = user.user_displayName;
    const cardAuth = user.authorizationCode;
    const celeb = await Celebrity.findOne({ where: { id: celebId } });
    if (!celeb) return { errorMessage: "This celebrity is no longer available" };
    if (celeb.userId === userId) return { errorMessage: "You cannot make a request to yourself" };
    const celebAlias = celeb.alias;
    const celebThumbnail = appendCdnLink(celeb.thumbnail);
    const acceptsCallTypeA = celeb.acceptsCallTypeA;
    const acceptsCallTypeB = celeb.acceptsCallTypeB;
    if (acceptsCallTypeA === true && Input.callType === CallType.CALL_TYPE_A) {
      callRequestType = RequestType.CALL_TYPE_A;
      callDurationInSeconds = VIDEO_CALL_TYPE_A_DURATION;
    } else if (acceptsCallTypeB === true && Input.callType === CallType.CALL_TYPE_B) {
      callRequestType = RequestType.CALL_TYPE_B;
      callDurationInSeconds = VIDEO_CALL_TYPE_B_DURATION;
    } else return { errorMessage: `Sorry! ${celebAlias} doesn't currently accept this type of request` };
    const CallScheduleRepo = AppDataSource.getTreeRepository(CallScheduleBase);
    const availableSlot = await CallScheduleRepo.findOne({ where: { id: Input.selectedTimeSlotId } });
    if (!availableSlot || availableSlot.available === (false || null)) {
      return {
        errorMessage: "The selected time slot is no longer available, please select another time for this call",
      };
    }

    const transactionAmount =
      callRequestType === RequestType.CALL_TYPE_A
        ? (celeb.callTypeA * 100).toString()
        : (celeb.callTypeB * 100).toString();
    const ref = createhashString([email, userId, celeb.id]);

    const chargePayment = await paymentManager().chargeCard(email, transactionAmount, cardAuth, ref, {
      userId,
      recipient: celeb.userId,
      availableSlotId: availableSlot.id,
    });

    if (!chargePayment) return { errorMessage: "Payment Error!" };

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
      requestorName: requestorName,
      recipient: celeb.userId,
      requestType: callRequestType,
      amount: transactionAmount,
      description: `Video call request from ${requestorName} to ${celebAlias}`,
      callScheduleId: availableSlot.id,
      callDurationInSeconds: callDurationInSeconds.toString(),
      callRequestBegins,
      requestExpires,
      recipientAlias: celebAlias,
      recipientThumbnail: celebThumbnail,
      paymentRef: ref,
    };
    const result = await Requests.create(request).save();
    if (result) {
      return { success: "Request Sent!" };
    }
    return { errorMessage: "Failed to create your request at this time. Try again later" };
  }

  @Mutation(() => VideoUploadData)
  @UseMiddleware(isAuthenticated)
  async fulfilShoutoutRequest(
    @Arg("requestId", () => Int) requestId: number,
    @Ctx() { req }: AppContext
  ): Promise<VideoUploadData> {
    const userId = req.session.userId as string; //
    const bucketName = process.env.AWS_BUCKET_NAME;
    try {
      const request = await validateRecipient(userId, requestId);
      if (request) {
        if (request.status !== RequestStatus.ACCEPTED) throw new Error();
        const owner = request.requestor;
        const celebAlias = request.recipientAlias;
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
        await Requests.update(request.id, { status: RequestStatus.PROCESSING });
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
      const request = await (
        await Requests.createQueryBuilder()
          .update({ status: RequestStatus.PROCESSING })
          .where({ id: requestId })
          .returning('"callScheduleId"')
          .execute()
      ).raw[0];
      const callScheduleTreeRepo = AppDataSource.getTreeRepository(CallScheduleBase);
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
            .returning('requestor, "requestType", "recipientAlias"')
            .execute()
        ).raw[0];
        const requestType = request.requestType === "shoutout" ? "shoutout" : "video call";
        const celebAlias = request.recipientAlias;
        sendInstantNotification(
          [request.requestor],
          "Response Alert",
          `Your ${requestType} request to ${celebAlias} has been ${status}`,
          NotificationRouteCode.RESPONSE
        );
      } catch (err) {
        return {
          errorMessage: "Error processing request, Try again later",
        };
      }
      return { success: "Request reponse saved" };
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
    const queryBuilder = AppDataSource.getRepository(Requests)
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
    const queryBuilder = AppDataSource.getRepository(Requests)
      .createQueryBuilder("requests")
      .where("requests.recipient = :userId", { userId })
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
    const queryBuilder = AppDataSource.getRepository(Requests)
      .createQueryBuilder("requests")
      .where(
        new Brackets((qb) => {
          qb.where("requests.recipient = :userId", { userId }).orWhere("requests.requestor = :userId", { userId });
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
