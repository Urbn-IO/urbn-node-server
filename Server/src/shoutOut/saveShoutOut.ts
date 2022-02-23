import { ShoutOuts } from "../entities/ShoutOuts";
import { User } from "../entities/User";

export const saveShoutOut = async (
  videoUrl: string,
  thumbNailUrl: string,
  ownedBy: string,
  userId: string | undefined
) => {
  const owner = await User.findOne({ where: { userId: ownedBy } });
  const shoutOut = ShoutOuts.create({
    videoUrl,
    celebId: userId,
    thumbNailUrl,
    user: owner,
  });
  try {
    await shoutOut.save();
  } catch (err) {
    throw new Error("An error Occured");
  }
};
