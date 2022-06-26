import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { CallTokenResponse } from "../utils/graphqlTypes";
import { storeRoomName } from "../services/video/videoRoomManager";
import { AppContext } from "../types";
import { ValidateRecipient } from "../utils/requestValidations";
import { createVideoCallRoom, getVideoCallToken } from "../services/video/calls";

@Resolver()
export class VideoCallResolver {
  @Query(() => CallTokenResponse, { nullable: true })
  @UseMiddleware(isAuthenticated)
  async acceptVideoCall(@Arg("requestId") requestId: number, @Ctx() { req }: AppContext): Promise<CallTokenResponse> {
    const userId = req.session.userId;
    const identity = userId as string;
    const request = await ValidateRecipient(identity, requestId);
    if (request) {
      const callRoomName = await createVideoCallRoom(request.callDurationInSeconds);
      if (callRoomName) {
        const callToken = getVideoCallToken(requestId, identity, callRoomName);
        storeRoomName(requestId, callRoomName);
        return { token: callToken, roomName: callRoomName };
      }
      return { errorMessage: "An error occured while trying to create video call session" };
    }
    return { errorMessage: "Unauthorized call request" };
  }

  //   @Query(() => CallTokenResponse, { nullable: true })
  //   @UseMiddleware(isAuthenticated)
  //   async joinVideoCall(@Arg("requestId") requestId: number, @Ctx() { req }: AppContext): Promise<CallTokenResponse> {
  //     const userId = req.session.userId;
  //     const identity = userId as string;
  //     const AccessToken = jwt.AccessToken;
  //     const VideoGrant = AccessToken.VideoGrant;
  //     let token, roomName;
  //     const isValidRequestRecepient = await ValidateRequestor(identity, requestId);
  //     if (isValidRequestRecepient) {
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
