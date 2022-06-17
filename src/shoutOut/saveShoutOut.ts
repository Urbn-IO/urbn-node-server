import { NotificationRouteCode, RequestStatus, VideoOutput } from "../types";
import { Shoutout } from "../entities/Shoutout";
import { User } from "../entities/User";
import { getConnection, In } from "typeorm";
import { sendPushNotification } from "../services/notifications/handler";
import { Requests } from "../entities/Requests";

export const saveShoutout = async (data: VideoOutput[]) => {
  const shoutouts: Shoutout[] = [];
  const ownerIds = data.map((x) => x.owner);
  const user = await User.find({ where: { userId: In(ownerIds) } });
  if (user === undefined || user.length === 0) {
    return;
  }

  data.forEach((x) => {
    const userObj = user.find((y) => y.userId === x.owner);
    const shoutOutObj = Shoutout.create({
      celebAlias: x.alias,
      celebId: x.userId,
      workFlowId: x.workFlowId,
      srcVideo: x.srcVideo,
      datePublished: x.datePublished,
      hlsUrl: x.hlsUrl,
      mp4Url: x.mp4Url,
      thumbnailUrl: x.thumbnailUrl,
      durationInSeconds: x.durationInSeconds,
      user: userObj,
    });
    shoutouts.push(shoutOutObj);
  });

  try {
    await Shoutout.save(shoutouts);
    const requestIds = data.map((x) => x.requestId) as string[];
    await getConnection()
      .createQueryBuilder()
      .update(Requests)
      .set({ status: RequestStatus.FULFILLED })
      .where("id In (:...requestIds)", { requestIds })
      .execute();

    sendPushNotification(
      ownerIds as string[],
      "New Shoutout!",
      "You have received a new shoutout video",
      NotificationRouteCode.PROFILE_SHOUTOUT
    );
  } catch (err) {
    throw new Error("An error Occured");
  }
};
