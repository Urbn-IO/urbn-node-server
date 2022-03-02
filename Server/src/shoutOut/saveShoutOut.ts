import { Shoutout } from "../entities/Shoutout";
import { User } from "../entities/User";

export const saveShoutout = async (
  videoUrl: string,
  thumbNailUrl: string,
  ownedBy: string,
  userId: string | undefined
) => {
  const owner = await User.findOne({ where: { userId: ownedBy } });
  const shoutOut = Shoutout.create({
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
