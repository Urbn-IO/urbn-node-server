import AppDataSource from 'config/ormconfig';
import { LOCKDOWN_STATUS, PREMIUM_VIDEO_CDN, VIDEO_CALL_TYPE_A_DURATION, VIDEO_CALL_TYPE_B_DURATION } from 'constant';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import { Celebrity } from 'entities/Celebrity';
import { Requests } from 'entities/Requests';
import { User } from 'entities/User';
import { getSignedVideoMetadata } from 'lib/cloudfront/uploadSigner';
import productMapping from 'productMapping';
import { setupCallReminder, setupRequestReminder, updateRequestAndNotify } from 'request/manage';
import getTransaction from 'services/apple/iap/transaction';
import sendMail from 'services/aws/email/manager';
import { sendInstantNotification } from 'services/notifications/handler';
import paymentManager from 'services/payments/payments';
import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql';
import { Brackets } from 'typeorm';
import {
  AppContext,
  AvailableDay,
  CallType,
  ContentType,
  DayOfTheWeek,
  EmailSubject,
  NotificationRouteCode,
  PlatformOptions,
  RequestStatus,
  RequestType,
  Roles,
} from 'types';
import createhashString from 'utils/createHashString';
import {
  GenericResponse,
  OrderResponse,
  ShoutoutRequestInput,
  VideoCallRequestInputs,
  VideoUploadResponse,
} from 'utils/graphqlTypes';
import { badEmailNotifier, getNextAvailableDate, reserveVideoCallScheduleTimeSlot } from 'utils/helpers';
dayjs.extend(utc);
dayjs.extend(duration);

@Resolver()
export class RequestsResolver {
  @Mutation(() => OrderResponse)
  @Authorized()
  async createShoutoutRequest(
    @Arg('input') input: ShoutoutRequestInput,
    @Ctx() { req }: AppContext,
    @Arg('transactionIdIAP', { nullable: true }) transactionIdIAP?: string
  ): Promise<OrderResponse> {
    if (LOCKDOWN_STATUS == 'ON') return { errorMessage: 'Shoutouts are currently unavailable', status: 'failed' };

    const userId = req.session.userId as string;

    try {
      const user = await User.findOne({ where: { userId } });

      if (!user) return { errorMessage: 'An error occured', status: 'failed' };
      const celebId = input.celebId;
      const email = user.email;
      const customerDisplayName = input.for ? input.for : (user.displayName as string);

      const celeb = await Celebrity.findOne({ where: { id: celebId } });
      if (!celeb) return { errorMessage: 'This celebrity is no longer available', status: 'failed' };
      if (celeb.userId === user.userId)
        return { errorMessage: 'You cannot make a request to yourself', status: 'failed' };
      //change this later
      celeb.shoutout = 50;
      const acceptsShoutOut = celeb.acceptsShoutout;
      const acceptsInstantShoutOut = celeb.acceptsInstantShoutout;
      if (acceptsShoutOut === false) {
        return {
          errorMessage: `Sorry! ${celeb.alias} doesn't currently accept shoutouts`,
          status: 'failed',
        };
      }
      if (acceptsInstantShoutOut === false && input.instantShoutout === true) {
        return {
          errorMessage: `Sorry! ${celeb.alias} doesn't currently accept instant shoutouts`,
          status: 'failed',
        };
      }
      const requestType = input.instantShoutout ? RequestType.INSTANT_SHOUTOUT : RequestType.SHOUTOUT;
      const requestExpires = input.requestExpiration;
      const reference = createhashString([user.userId, celeb.userId, requestExpires.toString()]);

      if (user.devicePlatform === PlatformOptions.IOS) {
        if (!transactionIdIAP) return { errorMessage: 'Invalid transaction id', status: 'failed' };
        const res = await getTransaction(transactionIdIAP);
        if (!res) return { errorMessage: "We couldn't verify your payment to apple", status: 'failed' };
        const request: Partial<Requests> = {
          reference,
          customer: user.userId,
          customerDisplayName,
          celebrity: celeb.userId,
          celebrityAlias: celeb.alias,
          requestType,
          amount: productMapping.get(res.productId),
          description: input.description.trim(),
          requestExpires,
          inAppPurchaseProductID: res.productId,
        };
        await updateRequestAndNotify(request, true);
        return { status: 'success' };
      }

      const transactionAmount = input.instantShoutout
        ? (celeb.instantShoutout * 100).toString()
        : (celeb.shoutout * 100).toString();

      const request: Partial<Requests> = {
        reference,
        customer: user.userId,
        customerDisplayName,
        celebrity: celeb.userId,
        celebrityAlias: celeb.alias,
        requestType,
        amount: transactionAmount,
        description: input.description.trim(),
        requestExpires,
      };

      const authUrl = await paymentManager().initializePayment(email, transactionAmount, request);
      if (!authUrl) return { errorMessage: 'Payment Error! Try again', status: 'failed' };

      return { authUrl, status: 'success' };
    } catch (err) {
      console.error(err);
      return {
        errorMessage: 'We are unable to place a request for you at the moment, Please try again later',
        status: 'failed',
      };
    }
  }

  @Mutation(() => OrderResponse)
  @Authorized()
  async createVideoCallRequest(
    @Arg('input') input: VideoCallRequestInputs,
    @Ctx() { req }: AppContext,
    @Arg('transactionIdIAP', { nullable: true }) transactionIdIAP?: string
  ): Promise<OrderResponse> {
    let callRequestType;
    let callDurationInSeconds;
    let callSlotId = '';
    let callSlotDay = DayOfTheWeek.SUNDAY;
    let callStartTime = '';
    const userId = req.session.userId as string;
    const celebId = input.celebId;

    if (LOCKDOWN_STATUS == 'ON') return { errorMessage: 'Video calls are currently unavailable', status: 'failed' };

    try {
      const user = await User.findOne({ where: { userId } });

      if (!user) return { errorMessage: 'An error occured', status: 'failed' };

      const email = user.email;
      const customerDisplayName = user.displayName;
      const celeb = await Celebrity.findOne({
        where: { id: celebId },
        select: [
          'userId',
          'alias',
          'thumbnail',
          'acceptsCallTypeA',
          'acceptsCallTypeB',
          'availableTimeSlots',
          'callTypeA',
          'callTypeB',
        ],
      });
      if (!celeb) {
        return { errorMessage: 'This celebrity is no longer available', status: 'failed' };
      }
      //Change this later!!
      celeb.callTypeA = 100;
      celeb.callTypeB = 100;
      const availableTimeSlots = celeb.availableTimeSlots;
      const acceptsCallTypeA = celeb.acceptsCallTypeA;
      const acceptsCallTypeB = celeb.acceptsCallTypeB;
      if (acceptsCallTypeA === true && input.callType === CallType.CALL_TYPE_A) {
        callRequestType = RequestType.CALL_TYPE_A;
        callDurationInSeconds = VIDEO_CALL_TYPE_A_DURATION;
      } else if (acceptsCallTypeB === true && input.callType === CallType.CALL_TYPE_B) {
        callRequestType = RequestType.CALL_TYPE_B;
        callDurationInSeconds = VIDEO_CALL_TYPE_B_DURATION;
      } else
        return {
          errorMessage: `Sorry! ${celeb.alias} doesn't currently accept this type of request`,
          status: 'failed',
        };

      let wasNotFound = true;

      loop: for (const x of availableTimeSlots) {
        if (x.day === input.selectedTimeSlot.day) {
          for (const y of x.hourSlots) {
            for (const z of y.minSlots) {
              if (z.id === input.selectedTimeSlot.slotId && z.available === true) {
                wasNotFound = false;
                callSlotDay = x.day;
                callSlotId = z.id;
                callStartTime = z.start;
                break loop;
              } else if (z.id === input.selectedTimeSlot.slotId && z.available === false) {
                return {
                  errorMessage:
                    'The selected time slot is no longer available, please select another time for this call',
                  status: 'failed',
                };
              }
            }
          }
        }
      }

      if (wasNotFound) {
        return { errorMessage: 'slotId was not found for supplied day', status: 'failed' };
      }

      const availabeDate = getNextAvailableDate(callSlotDay);

      const startTime = dayjs.utc(callStartTime).format('HH:mm:ss');
      const startTimeSplit = startTime.split(':');

      const availableDay = availabeDate
        .utc(true)
        .set('hour', parseInt(startTimeSplit[0]))
        .set('minute', parseInt(startTimeSplit[1]))
        .set('second', parseInt(startTimeSplit[2]));

      const callRequestBegins = new Date(availableDay.format());
      const requestExpires = new Date(availableDay.add(5, 'minute').format());

      const reference = createhashString([userId, celeb.userId, callSlotId, requestExpires.toString()]);

      if (user.devicePlatform === PlatformOptions.IOS) {
        if (!transactionIdIAP) return { errorMessage: 'Invalid transaction id', status: 'failed' };
        const res = await getTransaction(transactionIdIAP);
        if (!res) return { errorMessage: "We couldn't verify your payment to apple", status: 'failed' };
        const request: Partial<Requests> = {
          reference,
          customer: user.userId,
          customerDisplayName,
          celebrity: celeb.userId,
          celebrityAlias: celeb.alias,
          requestType: callRequestType,
          amount: productMapping.get(res.productId),
          description: `Video call request from ${customerDisplayName} to ${celeb.alias}`,
          callSlotId,
          callDurationInSeconds: callDurationInSeconds.toString(),
          callRequestBegins,
          requestExpires,
          inAppPurchaseProductID: res.productId,
        };
        await updateRequestAndNotify(request, true);
        await reserveVideoCallScheduleTimeSlot(celeb.userId, callSlotId, input.selectedTimeSlot.day);
        return { status: 'success' };
      }

      const transactionAmount =
        callRequestType === RequestType.CALL_TYPE_A
          ? (celeb.callTypeA * 100).toString()
          : (celeb.callTypeB * 100).toString();

      const request: Partial<Requests> | AvailableDay = {
        reference,
        customer: userId,
        customerDisplayName,
        celebrity: celeb.userId,
        celebrityAlias: celeb.alias,
        requestType: callRequestType,
        amount: transactionAmount,
        description: `Video call request from ${customerDisplayName} to ${celeb.alias}`,
        callSlotId,
        callDurationInSeconds: callDurationInSeconds.toString(),
        callRequestBegins,
        requestExpires,
        availableDay: input.selectedTimeSlot.day,
      };

      const authUrl = await paymentManager().initializePayment(email, transactionAmount, request);

      if (!authUrl) return { errorMessage: 'Payment Error! Try again', status: 'failed' };

      return { authUrl, status: 'success' };
    } catch (err) {
      console.error(err);
      return {
        errorMessage: 'We are unable to place a request for you at the moment, Please try again later',
        status: 'failed',
      };
    }
  }

  @Mutation(() => VideoUploadResponse)
  @Authorized(Roles.CELEBRITY)
  async fulfilShoutoutRequest(
    @Arg('reference') reference: string,
    @Ctx() { req }: AppContext
  ): Promise<VideoUploadResponse> {
    // resolver celeb uses to fulfil a shoutout request
    const userId = req.session.userId as string; //
    try {
      const request = await Requests.findOne({ where: { reference } });
      if (!request) return { errorMessage: 'Unauthorized action' };
      if (request.status !== RequestStatus.ACCEPTED) {
        throw new Error('Unable to access this request!');
      }
      const celebAlias = request.celebrityAlias;
      const data = getSignedVideoMetadata({
        cloudFront: PREMIUM_VIDEO_CDN,
        customMetadata: {
          reference,
          userId,
          alias: celebAlias,
          owner: request.customer,
          contentType: ContentType.SHOUTOUT,
        },
      });
      return data;
    } catch (err) {
      console.error(err);
      return { errorMessage: 'Error fulfilling request, Try again later' };
    }
  }

  @Mutation(() => GenericResponse)
  @Authorized(Roles.CELEBRITY)
  async respondToRequest(@Arg('reference') reference: string, @Arg('status') status: string): Promise<GenericResponse> {
    if (status === RequestStatus.ACCEPTED || status === RequestStatus.REJECTED) {
      try {
        const request: Requests = await (
          await Requests.createQueryBuilder().update({ status }).where({ reference }).returning('*').execute()
        ).raw[0];
        let requestType: string;
        let duration: string;
        if (request.requestType === RequestType.SHOUTOUT || request.requestType === RequestType.INSTANT_SHOUTOUT) {
          requestType = 'Shoutout';
          duration = 'Not Applicable';
        } else {
          requestType = 'Video Call';
          duration = `${dayjs.duration({ seconds: parseInt(request.callDurationInSeconds) }).asMinutes()} Minutes`;
        }

        const celebAlias = request.celebrityAlias;
        sendInstantNotification(
          [request.customer],
          'Response Alert',
          `Your ${requestType} request to ${celebAlias} has been ${status}`,
          NotificationRouteCode.DEFAULT
        );

        //set up request & call reminders
        if (request.callRequestBegins && request.status === RequestStatus.ACCEPTED) await setupCallReminder(request);
        if (request.status === RequestStatus.ACCEPTED) await setupRequestReminder(request);

        const customer = await User.findOne({
          where: {
            userId: request.customer,
          },
        });

        if (customer) {
          if (customer.isEmailActive) {
            const subject =
              status === RequestStatus.ACCEPTED ? EmailSubject.ACCEPTED_REQUEST : EmailSubject.DECLINED_REQUEST;
            const expiration = dayjs(request.requestExpires as Date)
              .utc()
              .toString();

            sendMail({
              emailAddresses: [customer.email],
              subject,
              name: customer.displayName,
              celebAlias: celebAlias,
              amount: request.amount,
              currency: '₦',
              requestType,
              duration,
              expiration,
            });
          } else badEmailNotifier([customer.userId]);
        }
      } catch (err) {
        console.log(err);
        return {
          errorMessage: 'Error processing request, Try again later',
        };
      }
      return { success: `Request ${status}` };
    }
    return { errorMessage: 'Invalid response to request' };
  }

  @Query(() => [Requests])
  @Authorized()
  async sentRequests(
    @Arg('limit', () => Int) limit = 8,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: AppContext
  ) {
    const userId = req.session.userId;
    const maxLimit = Math.min(10, limit);
    const queryBuilder = AppDataSource.getRepository(Requests)
      .createQueryBuilder('requests')
      .where('requests.customer = :userId', { userId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('requests.status = :pendingStatus', { pendingStatus: RequestStatus.PENDING })
            .orWhere('requests.status = :processingStatus', { processingStatus: RequestStatus.PROCESSING })
            .orWhere('requests.status = :expiredStatus', { expiredStatus: RequestStatus.EXPIRED });
        })
      )
      .orderBy('requests.createdAt', 'DESC')
      .limit(maxLimit);

    if (cursor) {
      queryBuilder.andWhere('requests."createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }
    const requests = await queryBuilder.getMany();
    return requests;
  }

  @Query(() => [Requests])
  @Authorized(Roles.CELEBRITY)
  async receivedRequests(
    @Arg('limit', () => Int) limit = 8,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: AppContext
  ) {
    const userId = req.session.userId;
    const maxLimit = Math.min(10, limit);
    const status = RequestStatus.PENDING;
    const queryBuilder = AppDataSource.getRepository(Requests)
      .createQueryBuilder('requests')
      .where('requests.celebrity = :userId', { userId })
      .andWhere('requests.status = :status', { status })
      .orderBy('requests.createdAt', 'DESC')
      .limit(maxLimit);

    if (cursor) {
      queryBuilder.andWhere('requests."createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    const requests = await queryBuilder.getMany();
    return requests;
  }

  @Query(() => [Requests])
  @Authorized()
  async acceptedRequests(
    @Arg('limit', () => Int) limit = 8,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: AppContext
  ) {
    const userId = req.session.userId;
    const maxLimit = Math.min(10, limit);
    const queryBuilder = AppDataSource.getRepository(Requests)
      .createQueryBuilder('requests')
      .where(
        new Brackets((qb) => {
          qb.where('requests.celebrity = :userId', {
            userId,
          }).orWhere('requests.customer = :userId', { userId });
        })
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where('requests.status = :acceptedStatus', { acceptedStatus: RequestStatus.ACCEPTED }).orWhere(
            new Brackets((qb) => {
              qb.where('requests.status = :expiredStatus', { expiredStatus: RequestStatus.EXPIRED }).andWhere(
                'requests.prevStatus = :prevStatus',
                { prevStatus: RequestStatus.ACCEPTED }
              );
            })
          );
        })
      )
      .orderBy('requests.createdAt', 'DESC')
      .limit(maxLimit);

    if (cursor) {
      queryBuilder.andWhere('requests."createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    const requests = await queryBuilder.getMany();
    return requests;
  }
}
