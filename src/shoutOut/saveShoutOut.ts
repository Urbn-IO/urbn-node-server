import { VideoOutput } from "../types";
import { Shoutout } from "../entities/Shoutout";
import { User } from "../entities/User";
import { In } from "typeorm";

export const saveShoutout = async (data: VideoOutput[]) => {
  const shoutouts: Shoutout[] = [];
  const ownerIds = data.map((x) => x.owner);
  const user = await User.find({ where: { userId: In(ownerIds) } });
  if (!user) {
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
  } catch (err) {
    throw new Error("An error Occured");
  }
};
