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
import { CallTokenResponse } from "../utils/graphqlTypes";
import { AppContext, SubscriptionTopics } from "../types";
import { validateRecipient, validateRequestor } from "../utils/requestValidations";
import { createVideoCallRoom, getVideoCallToken } from "../services/video/calls";
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
      const callRoomName = await createVideoCallRoom(request.callDurationInSeconds);
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

  // @Subscription(() => Notification, {
  //   topics: "NOTIFICATIONS",
  //   filter: ({ payload, args }: ResolverFilterData<CallTokenResponse, NewNotificationArgs>) => {
  //     return payload. === args.userId;
  //   },
  // })
  // newNotification(@Root() notification: Notification, @Args() { userId }: NewRequestArgs): Notification {
  //   return notification;
  // }

  //   @Query(() => CallTokenResponse, { nullable: true })
  //   @UseMiddleware(isAuthenticated)
  //   async joinVideoCall(@Arg("requestId") requestId: number, @Ctx() { req }: AppContext): Promise<CallTokenResponse> {
  //     const userId = req.session.userId;
  //     const identity = userId as string;
  //     const AccessToken = jwt.AccessToken;
  //     const VideoGrant = AccessToken.VideoGrant;
  //     let token, roomName;
  //     const isValidRequestrecipient = await ValidateRequestor(identity, requestId);
  //     if (isValidRequestrecipient) {
  //       const room = await CallRoom.findOne({
  //         where: { requestId },
  //         select: ["roomName"],
  //       });
  //       if (room) {
  //         roomName = room.roomName;
  //         const videoGrant = new VideoGrant({
  //           room: roomName,
  //         });
  //         // token = new AccessToken(this.twilioAccountSid, this.twilioApiKey, this.twilioApiSecret, {
  //         //   identity,
  //         //   ttl: 900,
  //         // });
  //         token.addGrant(videoGrant);
  //         token = token.toJwt();
  //       } else {
  //         return { errorMessage: "An error occured" };
  //       }
  //       return { token, roomName };
  //     }
  //     return { errorMessage: "You aren't authorized to join this call" };
  //   }
}
