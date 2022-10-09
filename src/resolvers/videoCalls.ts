import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Publisher,
  PubSub,
  Resolver,
  ResolverFilterData,
  Root,
  Subscription,
  UseMiddleware,
} from "type-graphql";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { CallTokenResponse, VideoCallEvent } from "../utils/graphqlTypes";
import { AppContext, RequestStatus, SubscriptionTopics } from "../types";
import { validateRecipient, validateRequestor } from "../utils/requestValidations";
import { createVideoCallRoom, getVideoCallToken } from "../services/call/calls";
import { sendCallNotification } from "../services/notifications/handler";

@Resolver()
export class VideoCallResolver {
  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async initiateVideoCall(@Arg("requestId", () => Int) requestId: number, @Ctx() { req }: AppContext) {
    const userId = req.session.userId as string;
    const request = await validateRequestor(userId, requestId);
    if (request) {
      if (request.status !== RequestStatus.ACCEPTED) return false;
      await sendCallNotification(request.celebrity, requestId, request.userDisplayName);
      return true;
    }
    return false;
  }

  @Mutation(() => CallTokenResponse)
  @UseMiddleware(isAuthenticated)
  async acceptVideoCall(
    @Arg("requestId", () => Int) requestId: number,
    @PubSub(SubscriptionTopics.VIDEO_CALL) publish: Publisher<CallTokenResponse>,
    @Ctx() { req }: AppContext
  ): Promise<CallTokenResponse> {
    const userId = req.session.userId;
    const celebrity = userId as string;
    const request = await validateRecipient(celebrity, requestId);
    if (request) {
      const user = request.user;
      const callRoomName = await createVideoCallRoom(request.id, request.callDurationInSeconds);
      if (callRoomName) {
        const [callToken, userCallToken] = getVideoCallToken([celebrity, user], callRoomName);
        publish({ token: userCallToken, roomName: callRoomName, user });
        return { token: callToken, roomName: callRoomName };
      }
      return { errorMessage: "An error occured while trying to create video call session" };
    }
    return { errorMessage: "Unauthorized call request" };
  }

  @Subscription({
    topics: SubscriptionTopics.VIDEO_CALL,
    filter: ({ payload, context }: ResolverFilterData<CallTokenResponse, any, any>) => {
      return context.userId === payload.user;
    },
  })
  listenToCallEvent(@Root() call: CallTokenResponse): CallTokenResponse {
    return call;
  }

  @Subscription({
    topics: SubscriptionTopics.CALL_STATUS,
    filter: ({ payload, context }: ResolverFilterData<VideoCallEvent, any, any>) => {
      const res = context.userId === payload.participantA || context.userId === payload.participantB;
      return res;
    },
  })
  callStatus(@Root() status: VideoCallEvent): VideoCallEvent {
    return status;
  }
}
