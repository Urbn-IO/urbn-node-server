import {
  Arg,
  Authorized,
  Ctx,
  Int,
  Mutation,
  Publisher,
  PubSub,
  Resolver,
  ResolverFilterData,
  Root,
  Subscription,
} from 'type-graphql';
import { Requests } from '../entities/Requests';
import { createVideoCallRoom, getVideoCallToken } from '../services/call/calls';
import { sendCallNotification } from '../services/notifications/handler';
import { AppContext, RequestStatus, SubscriptionTopics } from '../types';
import { CallTokenResponse, VideoCallEvent } from '../utils/graphqlTypes';
import { validateRequestor } from '../utils/requestValidations';

@Resolver()
export class VideoCallResolver {
  @Mutation(() => Boolean)
  @Authorized()
  async initiateVideoCall(@Arg('requestId', () => Int) requestId: number, @Ctx() { req }: AppContext) {
    const userId = req.session.userId as string;
    const request = await validateRequestor(userId, requestId);
    if (request) {
      if (request.status !== RequestStatus.ACCEPTED) return false;
      await sendCallNotification(request.celebrity, requestId, request.customerDisplayName);
      return true;
    }
    return false;
  }

  @Mutation(() => CallTokenResponse)
  @Authorized()
  async acceptVideoCall(
    @Arg('requestId', () => Int) requestId: number,
    @PubSub(SubscriptionTopics.VIDEO_CALL)
    publish: Publisher<CallTokenResponse>,
    @Ctx() { req }: AppContext
  ): Promise<CallTokenResponse> {
    const userId = req.session.userId;
    const celebrity = userId as string;
    // const request = await validateRecipient(celebrity, requestId);
    const request = await Requests.findOne({
      where: {
        id: requestId,
      },
    });

    if (request) {
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
    return { errorMessage: 'Unauthorized call request' };
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
