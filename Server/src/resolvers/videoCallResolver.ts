import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import { isAuth } from "../middleware/isAuth";
import { v4 } from "uuid";
import { callTokenResponse } from "../utils/graphqlTypes";
import { saveCallToken } from "../calls/callTokenManager";
import { AppContext } from "../types";
import { CallTokens } from "../entities/CallTokens";

@Resolver()
export class VideoCallResolver {
  @Query(() => callTokenResponse, { nullable: true })
  @UseMiddleware(isAuth)
  callInitiatorToken(
    @Arg("role") clientRole: string,
    @Arg("uid") uid: string,
    @Arg("tokenType") tokenType: string,
    @Ctx() { req }: AppContext
  ): callTokenResponse {
    const APP_ID = process.env.AGORA_APP_ID;
    const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
    const userId = req.session.userId;
    const expireTime = 1800;
    const serial = v4();
    const channelName = `urban_call_channel:${serial}`;
    // get uid
    if (!uid || uid === "") {
      return {
        errors: [{ errorMessage: "uid is required", field: "uid" }],
      };
    }
    // get role
    let role;
    if (clientRole === "publisher") {
      role = RtcRole.PUBLISHER;
    } else if (clientRole === "audience") {
      role = RtcRole.SUBSCRIBER;
    } else {
      return {
        errors: [{ errorMessage: "role is incorrect", field: "role" }],
      };
    }
    // get the expire time
    // if (callType === "typeA") {
    //   expireTime = 180;
    // } else if (callType === "typeB") {
    //   expireTime = 3000;
    // } else {
    //   expireTime = 1800;
    // }

    // calculate privilege expire time
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    // build the token
    let token;
    if (tokenType === "userAccount") {
      token = RtcTokenBuilder.buildTokenWithAccount(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        role,
        privilegeExpireTime
      );
    } else if (tokenType === "uid") {
      token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        parseInt(uid, 10),
        role,
        privilegeExpireTime
      );
    } else {
      return {
        errors: [{ errorMessage: "tokenType is invalid", field: "tokenType" }],
      };
    }
    if (userId) {
      saveCallToken(token, userId, channelName);
    }

    // return the token
    return { token, channelName };
  }

  @Query(() => callTokenResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async callRecepientToken(
    @Arg("requestorId") requestorId: string
  ): Promise<callTokenResponse> {
    let token, channelName;
    const tokenObj = await CallTokens.findOne({
      where: { userId: requestorId },
      select: ["token", "channelName"],
    });

    if (tokenObj) {
      token = tokenObj?.token;
      channelName = tokenObj?.channelName;
    } else {
      return {
        errors: [{ errorMessage: "An error occured", field: "" }],
      };
    }

    return { token, channelName };
  }
}
