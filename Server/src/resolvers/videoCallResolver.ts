import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { isAuth } from "../middleware/isAuth";
import { v4 } from "uuid";
import { callTokenResponse } from "../utils/graphqlTypes";
import { saveCallToken } from "../utils/saveCallToken";
import { CallTokens } from "../entities/CallTokens";
import { jwt } from "twilio";
import { AppContext } from "../types";

@Resolver()
export class VideoCallResolver {
  @Query(() => callTokenResponse, { nullable: true })
  @UseMiddleware(isAuth)
  callInitiatorToken(
    @Arg("requestId") requestId: number,
    @Ctx() { req }: AppContext
  ): callTokenResponse {
    const userId = req.session.userId;
    const AccessToken = jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioApiKey = process.env.TWILIO_API_KEY;
    const twilioApiSecret = process.env.TWILIO_API_SECRET;

    const identity = userId as string;
    const serial = v4();
    const roomName = `urban_call_room:${serial}`;

    // Create Video Grant
    const videoGrant = new VideoGrant({
      room: roomName,
    });

    // Create an access token which we will sign and return to the client,
    // containing the grant we just created
    const token = new AccessToken(
      twilioAccountSid,
      twilioApiKey,
      twilioApiSecret,
      { identity }
    );
    token.addGrant(videoGrant);

    // Serialize the token to a JWT string
    const callToken = token.toJwt();

    saveCallToken(callToken, requestId, roomName);

    return { token: callToken, roomName };
  }

  @Query(() => callTokenResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async callRecepientToken(
    @Arg("requestId") requestId: number
  ): Promise<callTokenResponse> {
    let token, roomName;
    const tokenObj = await CallTokens.findOne({
      where: { requestId },
      select: ["token", "roomName"],
    });
    if (tokenObj) {
      token = tokenObj?.token;
      roomName = tokenObj?.roomName;
    } else {
      return {
        errors: [{ errorMessage: "An error occured", field: "" }],
      };
    }
    return { token, roomName };
  }
}

//Agora Token Generation
// @Query(() => callTokenResponse, { nullable: true })
// @UseMiddleware(isAuth)
// callInitiatorToken(
//   @Arg("role") clientRole: string,
//   @Arg("uid") uid: string,
//   @Arg("tokenType") tokenType: string,
//   @Ctx() { req }: AppContext
// ): callTokenResponse {
//   const APP_ID = process.env.AGORA_APP_ID;
//   const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
//   const userId = req.session.userId;
//   const expireTime = 1800;
//   const serial = v4();
//   const channelName = `urban_call_channel:${serial}`;
//   // get uid
//   if (!uid || uid === "") {
//     return {
//       errors: [{ errorMessage: "uid is required", field: "uid" }],
//     };
//   }
//   // get role
//   let role;
//   if (clientRole === "publisher") {
//     role = RtcRole.PUBLISHER;
//   } else if (clientRole === "audience") {
//     role = RtcRole.SUBSCRIBER;
//   } else {
//     return {
//       errors: [{ errorMessage: "role is incorrect", field: "role" }],
//     };
//   }
//   // get the expire time
//   // if (callType === "typeA") {
//   //   expireTime = 180;
//   // } else if (callType === "typeB") {
//   //   expireTime = 3000;
//   // } else {
//   //   expireTime = 1800;
//   // }
//   // calculate privilege expire time
//   const currentTime = Math.floor(Date.now() / 1000);
//   const privilegeExpireTime = currentTime + expireTime;
//   // build the token
//   let token;
//   if (tokenType === "userAccount") {
//     token = RtcTokenBuilder.buildTokenWithAccount(
//       APP_ID,
//       APP_CERTIFICATE,
//       channelName,
//       uid,
//       role,
//       privilegeExpireTime
//     );
//   } else if (tokenType === "uid") {
//     token = RtcTokenBuilder.buildTokenWithUid(
//       APP_ID,
//       APP_CERTIFICATE,
//       channelName,
//       parseInt(uid, 10),
//       role,
//       privilegeExpireTime
//     );
//   } else {
//     return {
//       errors: [{ errorMessage: "tokenType is invalid", field: "tokenType" }],
//     };
//   }
//   if (userId) {
//     saveCallToken(token, userId, channelName);
//   }
//   // return the token
//   return { token, channelName };
// }
