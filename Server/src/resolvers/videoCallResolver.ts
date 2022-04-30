import crypto from "crypto";
import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { isAuth } from "../middleware/isAuth";
import { CallTokenResponse } from "../utils/graphqlTypes";
import { storeRoomName } from "../utils/videoRoomManager";
import { CallRoom } from "../entities/CallRoom";
import { jwt } from "twilio";
import { AppContext } from "../types";
import {
  ValidateRecipient,
  ValidateCallAndRequestor,
} from "../utils/requestValidations";

@Resolver()
export class VideoCallResolver {
  private twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  private twilioApiKey = process.env.TWILIO_API_KEY;
  private twilioApiSecret = process.env.TWILIO_API_SECRET;

  @Query(() => CallTokenResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async callInitiatorToken(
    @Arg("requestId") requestId: number,
    @Ctx() { req }: AppContext
  ): Promise<CallTokenResponse> {
    const userId = req.session.userId;
    const AccessToken = jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const identity = userId as string;
    const isValidRequest = await ValidateCallAndRequestor(identity, requestId);
    if (isValidRequest) {
      const currentTime = new Date().valueOf().toString();
      const randomNumber = Math.random().toString();
      const serial = crypto
        .createHash("md5")
        .update(currentTime + randomNumber)
        .digest("hex");
      const roomName = `urban_video_room:${serial}`;

      // Create Video Grant
      const videoGrant = new VideoGrant({
        room: roomName,
      });

      // Create an access token which we will sign and return to the client,
      // containing the grant we just created
      const token = new AccessToken(
        this.twilioAccountSid,
        this.twilioApiKey,
        this.twilioApiSecret,
        { identity, ttl: 900 }
      );
      token.addGrant(videoGrant);

      // Serialize the token to a JWT string
      const callToken = token.toJwt();

      storeRoomName(requestId, roomName);

      return { token: callToken, roomName };
    }
    return { errorMessage: "Unauthorized call request" };
  }

  @Query(() => CallTokenResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async callRecepientToken(
    @Arg("requestId") requestId: number,
    @Ctx() { req }: AppContext
  ): Promise<CallTokenResponse> {
    const userId = req.session.userId;
    const identity = userId as string;
    const AccessToken = jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;
    let token, roomName;
    const isValidRequestRecepient = await ValidateRecipient(
      identity,
      requestId
    );
    if (isValidRequestRecepient) {
      const room = await CallRoom.findOne({
        where: { requestId },
        select: ["roomName"],
      });
      if (room) {
        roomName = room.roomName;
        const videoGrant = new VideoGrant({
          room: roomName,
        });
        token = new AccessToken(
          this.twilioAccountSid,
          this.twilioApiKey,
          this.twilioApiSecret,
          {
            identity,
            ttl: 900,
          }
        );
        token.addGrant(videoGrant);
        token = token.toJwt();
      } else {
        return { errorMessage: "An error occured" };
      }
      return { token, roomName };
    }
    return { errorMessage: "You aren't authorized to join this call" };
  }
}
