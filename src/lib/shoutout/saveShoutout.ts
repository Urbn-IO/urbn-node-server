import { In } from 'typeorm';
import AppDataSource from '../../config/ormconfig';
import { Requests } from '../../entities/Requests';
import { Shoutout } from '../../entities/Shoutout';
import { User } from '../../entities/User';
import { sendInstantNotification } from '../../services/notifications/handler';
import { NotificationRouteCode, RequestStatus, VideoOutput } from '../../types';

const saveShoutout = async (data: Partial<VideoOutput>[]) => {
  try {
    const shoutouts: Shoutout[] = [];
    const ownerIds = data.map((x) => x.owner);
    const user = await User.find({ where: { userId: In(ownerIds) } });
    if (user.length === 0) {
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

    await Shoutout.save(shoutouts);
    const references = data.map((x) => x.reference) as string[];
    await AppDataSource.createQueryBuilder()
      .update(Requests)
      .set({ status: RequestStatus.FULFILLED })
      .where('reference In (:...references)', { references })
      .execute();

    sendInstantNotification(
      ownerIds as string[],
      'You received a Shoutout! 🌟',
      'You have received a new shoutout video!',
      NotificationRouteCode.PROFILE_SHOUTOUT
    );
  } catch (err) {
    console.error(err);
    return;
  }
};
export default saveShoutout;
