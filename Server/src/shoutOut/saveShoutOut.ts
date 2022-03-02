import { Shoutout } from "../entities/Shoutout";
import { User } from "../entities/User";

export const saveShoutout = async (
  video: string,
  thumbnail: string,
  ownedBy: string,
  userId: string | undefined
) => {
  const owner = await User.findOne({ where: { userId: ownedBy } });
  const shoutOut = Shoutout.create({
    video,
    celebId: userId,
    thumbnail,
    user: owner,
  });
  try {
    await shoutOut.save();
  } catch (err) {
    throw new Error("An error Occured");
  }
};
