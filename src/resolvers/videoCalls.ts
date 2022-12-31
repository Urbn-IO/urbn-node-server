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
import { CALL_RETRY_PREFIX } from '../constants';
import { Requests } from '../entities/Requests';
import { createVideoCallRoom, getVideoCallToken } from '../services/call/calls';
import { sendCallNotification } from '../services/notifications/handler';
import { AppContext, RequestStatus, Roles, SubscriptionTopics } from '../types';
import { CallTokenResponse, VideoCallEvent } from '../utils/graphqlTypes';

@Resolver()
export class VideoCallResolver {
  @Mutation(() => Boolean)
  @Authorized()
  async initiateVideoCall(@Arg('reference') reference: string, @Ctx() { redis }: AppContext) {
    const val = await redis.get(CALL_RETRY_PREFIX + reference);
    if (val) {
      let retries = parseInt(val);
      if (retries !== 3) {
        retries++;
        await redis.set(CALL_RETRY_PREFIX + reference, retries.toString());
      }
    }
    const request = await Requests.findOne({ where: { reference } });
    if (!request) return false;
    if (request.status !== RequestStatus.ACCEPTED) return false;
    await sendCallNotification(request.celebrity, reference, request.customerDisplayName);
    return true;
  }

  @Mutation(() => CallTokenResponse)
  @Authorized(Roles.CELEBRITY)
  async acceptVideoCall(
    @Arg('reference') reference: string,
    @PubSub(SubscriptionTopics.VIDEO_CALL)
    publish: Publisher<CallTokenResponse>,
    @Ctx() { req }: AppContext
  ): Promise<CallTokenResponse> {
    const userId = req.session.userId;
    const celebrity = userId as string;
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
