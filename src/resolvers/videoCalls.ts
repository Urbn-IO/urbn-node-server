import { CALL_RETRY_PREFIX } from 'constant';
import dayjs from 'dayjs';
import { Celebrity } from 'entities/Celebrity';
import { Requests } from 'entities/Requests';
import { changeRequestState } from 'request/manage';
import { sendCallNotification } from 'services/notifications/handler';
import { createVideoCallRoom, getVideoCallToken } from 'services/twilio/calls';
import {
  Arg,
  Authorized,
  Ctx,
  Mutation,
  Publisher,
  PubSub,
  Resolver,
  ResolverFilterData,
  Root,
  Subscription,
} from 'type-graphql';
import { AppContext, CallRetriesState, RequestStatus, Roles, SubscriptionTopics } from 'types';
import { CallTokenResponse, InitiateVideoCallResponse, VideoCallEvent } from 'utils/graphqlTypes';

@Resolver()
export class VideoCallResolver {
  @Mutation(() => InitiateVideoCallResponse)
  @Authorized()
  async initiateVideoCall(
    @Arg('reference') reference: string,
    @Ctx() { redis, req }: AppContext
  ): Promise<InitiateVideoCallResponse> {
    const userId = req.session.userId as string;
    let request;
    let celeb;
    let expiry;
    let data: Partial<CallRetriesState> = {};
    let attempts;

    const res = await redis.get(CALL_RETRY_PREFIX + reference);
    //
    switch (res) {
      //first call attempt
      case null:
        request = await Requests.findOne({ where: { reference } });
        if (!request) return { errorMessage: 'An error occured!' };
        if (request.customer !== userId) return { errorMessage: 'An error occured' };
        if (request.status !== RequestStatus.ACCEPTED) return { errorMessage: 'This request is no longer valid!' };
        celeb = await Celebrity.findOne({ where: { userId: request.celebrity } });
        if (!celeb?.thumbnail) {
          return { errorMessage: 'An error occured!' };
        }
        expiry = dayjs(request.requestExpires).unix();
        data = {
          attempts: 1,
          expiry,
          requestId: request.id,
          customer: request.customer,
          celebrity: request.celebrity,
          celebThumbnail: celeb.thumbnail,
          customerDisplayName: request.customerDisplayName,
        };
        await redis.set(CALL_RETRY_PREFIX + reference, JSON.stringify(data), 'EXAT', expiry);
        await sendCallNotification(request.celebrity, reference, request.customerDisplayName);
        return { attempts: data.attempts, celebThumbnail: celeb.thumbnail };
      // subsequent call attempts
      default:
        data = JSON.parse(res);
        attempts = data.attempts;
        expiry = data.expiry;
        if (
          !attempts ||
          !expiry ||
          !data.celebrity ||
          !data.customerDisplayName ||
          !data.requestId ||
          data.customer !== userId
        ) {
          return { errorMessage: 'An error occured' };
        }
        //User can only retry a call 3 times
        if (attempts >= 3) {
          await changeRequestState(data.requestId, RequestStatus.UNFULFILLED);
          return {
            errorMessage:
              'You have exceeded the max amount of call attempts! Your request will be expired and you will be refunded ',
          };
        }
        attempts++;
        data.attempts = attempts;
        await redis.set(CALL_RETRY_PREFIX + reference, JSON.stringify(data), 'EXAT', expiry);
        await sendCallNotification(data.celebrity, reference, data.customerDisplayName);
        return { attempts, celebThumbnail: data.celebThumbnail };
    }
  }

  @Mutation(() => CallTokenResponse)
  @Authorized(Roles.CELEBRITY)
  async acceptVideoCall(
    @Arg('reference') reference: string,
    @PubSub(SubscriptionTopics.VIDEO_CALL)
    publish: Publisher<CallTokenResponse>,
    @Ctx() { req }: AppContext
  ): Promise<CallTokenResponse> {
    const userId = req.session.userId as string;
    const celebrity = userId;
    // const request = await validateRecipient(celebrity, requestId);
    const request = await Requests.findOne({ where: { reference } });

    if (!request) return { errorMessage: 'Unauthorized call request' };

    const user = request.customer;
    const callRoomName = await createVideoCallRoom(request.id, request.callDurationInSeconds);
    if (callRoomName) {
      const [callToken, userCallToken] = getVideoCallToken([celebrity, user], callRoomName);
      publish({ token: userCallToken, roomName: callRoomName, user });
      return { token: callToken, roomName: callRoomName };
    }
    return {
      errorMessage: 'An error occured while trying to create video call session',
    };
  }

  @Subscription({
    topics: SubscriptionTopics.VIDEO_CALL,
    filter: ({
      payload,
      context,
    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ResolverFilterData<CallTokenResponse, any, any>) => {
      return context.userId === payload.user;
    },
  })
  listenToCallEvent(@Root() call: CallTokenResponse): CallTokenResponse {
    return call;
  }

  @Subscription({
    topics: SubscriptionTopics.CALL_STATUS,
    filter: ({
      payload,
      context,
    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ResolverFilterData<VideoCallEvent, any, any>) => {
      const res = context.userId === payload.participantA || context.userId === payload.participantB;
      return res;
    },
  })
  callStatus(@Root() status: VideoCallEvent): VideoCallEvent {
    return status;
  }
}
