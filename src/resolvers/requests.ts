import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql';
import { Brackets } from 'typeorm';
import AppDataSource from '../config/ormconfig';
import {
  INSTANT_SHOUTOUT_RATE,
  PREMIUM_VIDEO_CDN,
  VIDEO_CALL_TYPE_A_DURATION,
  VIDEO_CALL_TYPE_B_DURATION,
} from '../constants';
import { Celebrity } from '../entities/Celebrity';
import { Requests } from '../entities/Requests';
import { User } from '../entities/User';
import { getSignedVideoMetadata } from '../lib/cloudfront/uploadSigner';
import sendMail from '../services/aws/email/manager';
import { sendInstantNotification } from '../services/notifications/handler';
import paymentManager from '../services/payments/payments';
import {
  AppContext,
  CallType,
  ContentType,
  DayOfTheWeek,
  EmailSubject,
  NotificationRouteCode,
  RequestStatus,
  RequestType,
  Roles,
} from '../types';
import createhashString from '../utils/createHashString';
import {
  GenericResponse,
  ShoutoutRequestInput,
  VideoCallRequestInputs,
  VideoUploadResponse,
} from '../utils/graphqlTypes';
import { badEmailNotifier, getNextAvailableDate } from '../utils/helpers';
dayjs.extend(utc);
dayjs.extend(duration);

@Resolver()
export class RequestsResolver {
  @Mutation(() => GenericResponse)
  @Authorized()
  async createShoutoutRequest(
    @Arg('input') input: ShoutoutRequestInput,
    @Arg('cardId', () => Int) cardId: number,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    const userId = req.session.userId as string;
    const celebId = input.celebId;
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .select(['user.email', 'user.displayName'])
      .leftJoin('user.cards', 'cards')
      .where('cards.id = :cardId', { cardId })
      .addSelect(['cards.authorizationCode'])
      .getRawOne();

    if (!user)
      return {
        errorMessage: "We don't have this card anymore, try adding it again or try another",
      };

    const email = user.user_email as string;
    const customerDisplayName = input.for ? input.for : (user.user_displayName as string);
    const cardAuth = user.cards_authorizationCode as string;

    const celeb = await Celebrity.findOne({ where: { id: celebId } });
    if (!celeb) return { errorMessage: 'This celebrity is no longer available' };
    if (celeb.userId === userId) return { errorMessage: 'You cannot make a request to yourself' };
    const acceptsShoutOut = celeb.acceptsShoutout;
    const acceptsInstantShoutOut = celeb.acceptsInstantShoutout;
    if (acceptsShoutOut === false)
      return {
        errorMessage: `Sorry! ${celeb.alias} doesn't currently accept shoutouts`,
      };
    if (acceptsInstantShoutOut === false && input.instantShoutout === true) {
      return {
        errorMessage: `Sorry! ${celeb.alias} doesn't currently accept instant shoutouts`,
      };
    }
    const requestType = input.instantShoutout ? RequestType.INSTANT_SHOUTOUT : RequestType.SHOUTOUT;
    const transactionAmount = input.instantShoutout
      ? (celeb.shoutout * 100 * INSTANT_SHOUTOUT_RATE).toString()
      : (celeb.shoutout * 100).toString();

    const reference = createhashString([userId, celeb.userId, cardAuth]);
    const chargePayment = await paymentManager().chargeCard(email, transactionAmount, cardAuth, {
      userId,
      celebrity: celeb.userId,
      reference,
    });
    if (!chargePayment) return { errorMessage: 'Payment Error! Try again' };

    const requestExpires = new Date(dayjs(input.requestExpiration).utc(false).format());

    const request: Partial<Requests> = {
      reference,
      customer: userId,
      customerDisplayName,
      celebrity: celeb.userId,
      celebrityAlias: celeb.alias,
      requestType,
      amount: transactionAmount,
      description: input.description.trim(),
      requestExpires,
    };
    const result = await Requests.create(request).save();
    if (result) {
      return { success: 'Request Sent!' };
    }

    return {
      errorMessage: 'Failed to create your request at this time. Try again later',
    };
  }

  @Mutation(() => GenericResponse)
  @Authorized()
  async createVideoCallRequest(
    @Arg('input') input: VideoCallRequestInputs,
    @Arg('cardId', () => Int) cardId: number,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    let callRequestType;
    let callDurationInSeconds;
    let callSlotId = '';
    let callSlotDay = DayOfTheWeek.SUNDAY;
    let callStartTime = '';
    const userId = req.session.userId as string;
    const celebId = input.celebId;
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .select(['user.displayName', 'user.email'])
      .leftJoin('user.cards', 'cards')
      .where('cards.id = :cardId', { cardId })
      .addSelect(['cards."authorizationCode"'])
      .getRawOne();

    if (!user)
      return {
        errorMessage: "We don't have this card anymore, try adding it again or try another",
      };

    const email = user.user_email;
    const customerDisplayName = user.user_displayName;
    const cardAuth = user.authorizationCode;
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
      return { errorMessage: 'This celebrity is no longer available' };
    }
    // if (celeb.userId === userId)
    //   return { errorMessage: "You cannot make a request to yourself" };
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
                errorMessage: 'The selected time slot is no longer available, please select another time for this call',
              };
            }
          }
        }
      }
    }

    if (wasNotFound) {
      return { errorMessage: 'slotId was not found for supplied day' };
    }

    const transactionAmount =
      callRequestType === RequestType.CALL_TYPE_A
        ? (celeb.callTypeA * 100).toString()
        : (celeb.callTypeB * 100).toString();

    const reference = createhashString([userId, celeb.userId, cardAuth, callSlotId]);

    const chargePayment = await paymentManager().chargeCard(email, transactionAmount, cardAuth, {
      userId,
      celebrity: celeb.userId,
      reference,
      availableSlotId: callSlotId,
      availableDay: input.selectedTimeSlot.day,
    });

    if (!chargePayment) return { errorMessage: 'Payment Error! Try again' };

    const availabeDate = getNextAvailableDate(callSlotDay);
    const startTime = callStartTime;
    const startTimeSplit = startTime.split(':');
    const availableDay = availabeDate
      .set('hour', parseInt(startTimeSplit[0]))
      .set('minute', parseInt(startTimeSplit[1]))
      .set('second', parseInt(startTimeSplit[2]));

    const callRequestBegins = availableDay;
    const requestExpires = availableDay.add(5, 'minute');

    const request = {
      reference,
      customer: userId,
      customerDisplayName,
      celebrity: celeb.userId,
      celebrityAlias: celeb.alias,
      celebrityThumbnail: celeb.thumbnail,
      requestType: callRequestType,
      amount: transactionAmount,
      description: `Video call request from ${customerDisplayName} to ${celeb.alias}`,
      callSlotId,
      callDurationInSeconds: callDurationInSeconds.toString(),
      callRequestBegins,
      requestExpires,
    };
    const result = await Requests.create(request).save();
    if (result) {
      return { success: 'Request Sent!' };
    }
    return {
      errorMessage: 'Failed to create your request at this time. Try again later',
    };
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

        const requestType = request.requestType === 'shoutout' ? 'Shoutout' : 'Video Call';
        const celebAlias = request.celebrityAlias;
        sendInstantNotification(
          [request.customer],
          'Response Alert',
          `Your ${requestType} request to ${celebAlias} has been ${status}`,
          NotificationRouteCode.DEFAULT
        );
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

            const duration =
              requestType === 'Shoutout'
                ? 'Not Applicable'
                : `${dayjs.duration({ seconds: parseInt(request.callDurationInSeconds) }).asMinutes()} Minutes`;

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
        return {
          errorMessage: 'Error processing request, Try again later',
        };
      }
      return { success: 'Request reponse saved' };
    }
    return { errorMessage: 'Invalid response to request' };
  }

  @Query(() => [Requests])
  @Authorized()
  async sentRequests(
    @Arg('limit', () => Int) limit: number,
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
    @Arg('limit', () => Int) limit: number,
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
    @Arg('limit', () => Int) limit: number,
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
