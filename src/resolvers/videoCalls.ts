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
  // @Subscription({
  //   topics: ({ args, payload, context }) => args.topic,
  // })
  // newNotification(): Notification {
  //   return new Notification("d");
  // }
  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async initiateVideoCall(@Arg("requestId", () => Int) requestId: number, @Ctx() { req }: AppContext) {
    const userId = req.session.userId as string;
    const request = await validateRequestor(userId, requestId);
    if (request) {
      if (request.status !== RequestStatus.ACCEPTED) return false;
      await sendCallNotification(request.recipient, requestId, request.requestorName);
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
    const recipient = userId as string;
    const request = await validateRecipient(recipient, requestId);
    if (request) {
      const requestor = request.requestor;
      const callRoomName = await createVideoCallRoom(request.id, request.callDurationInSeconds);
      if (callRoomName) {
        const [callToken, requestorCallToken] = getVideoCallToken([recipient, requestor], callRoomName);
        publish({ token: requestorCallToken, roomName: callRoomName, requestor });
        return { token: callToken, roomName: callRoomName };
      }
      return { errorMessage: "An error occured while trying to create video call session" };
    }
    return { errorMessage: "Unauthorized call request" };
  }

  @Subscription({
    topics: SubscriptionTopics.VIDEO_CALL,
    filter: ({ payload, context }: ResolverFilterData<CallTokenResponse, any, any>) => {
      return context.userId === payload.requestor;
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

  ///////////////////Test stuff

  // @Mutation(() => Boolean)
  // testNotification(@Arg("payload") payload: NotificationsPayloadTest) {
  //   notificationsManager().sendInstantTestMessage(payload);
  //   return true;
  // }
  // @Mutation(() => Boolean)
  // testEmail(@Arg("payload") payload: NotificationsPayloadTest) {
  //   notificationsManager().sendInstantTestMessage(payload);
  //   return true;
  // }
  // @Mutation(() => String)
  // async testDeepLink(@Arg("url") url: string) {
  //   const link = await createDeepLink(url);
  //   if (link) return link;
  //   return "An error occured";
  // }
}
