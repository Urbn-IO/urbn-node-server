import { In } from 'typeorm';
import AppDataSource from '../../config/ormconfig';
import { APP_BASE_URL, SHOUTOUT_PLAYER_URL } from '../../constants';
import { Requests } from '../../entities/Requests';
import { Shoutout } from '../../entities/Shoutout';
import { User } from '../../entities/User';
import sendMail from '../../services/aws/email/manager';
import { createDynamicLink } from '../../services/deep_links/dynamicLinks';
import { sendInstantNotification } from '../../services/notifications/handler';
import { EmailSubject, NotificationRouteCode, RequestStatus, VideoOutput } from '../../types';
import { badEmailNotifier } from '../../utils/helpers';

const saveShoutout = async (data: Partial<VideoOutput>[]) => {
  try {
    const shoutouts: Shoutout[] = [];
    const emailList = [];
    const badEmailUsers: string[] = [];
    const ownerIds = data.map((x) => x.owner);
    const user = await User.find({ where: { userId: In(ownerIds) } });
    if (user.length === 0) {
      return;
    }

    const userIds = user.map((x) => x.userId);

    for (const video of data) {
      const userObj = user.find((y) => y.userId === video.owner);
      const playerLink = `${SHOUTOUT_PLAYER_URL}?hls=${video.hlsUrl}&mp4=${video.mp4Url}&thumbnail=${video.thumbnailUrl}`;
      const playerUrl = await createDynamicLink(playerLink, true, 'shoutout', {
        socialTitle: `Shoutout video from ${video.alias}`,
        socialDescription: `View shoutout video shared to you from ${video.alias}`,
        socialImageLink: video.thumbnailUrl,
      });
      const shoutOutObj = Shoutout.create({
        celebAlias: video.alias,
        celebId: video.userId,
        shareUrl: playerUrl,
        workFlowId: video.workFlowId,
        srcVideo: video.srcVideo,
        datePublished: video.datePublished,
        hlsUrl: video.hlsUrl,
        mp4Url: video.mp4Url,
        thumbnailUrl: video.thumbnailUrl,
        durationInSeconds: video.durationInSeconds,
        user: userObj,
      });

      shoutouts.push(shoutOutObj);

      const profileLink = `${APP_BASE_URL}/profile`;
      const profileUrl = await createDynamicLink(profileLink, false);

      if (!profileUrl) continue;
      const data = {
        userId: userObj?.userId,
        name: userObj?.displayName,
        email: userObj?.email,
        isEmailActive: userObj?.isEmailActive,
        celebAlias: video.alias,
        url: profileUrl,
      };

      emailList.push(data);
    }

    await Shoutout.save(shoutouts);
    const references = data.map((x) => x.reference) as string[];
    await AppDataSource.createQueryBuilder()
      .update(Requests)
      .set({ status: RequestStatus.FULFILLED })
      .where('reference In (:...references)', { references })
      .execute();

    sendInstantNotification(
      userIds,
      'You received a Shoutout! 🌟',
      'You have received a new shoutout video!',
      NotificationRouteCode.PROFILE_SHOUTOUT
    );

    emailList.forEach((x) => {
      if (x?.isEmailActive === true) {
        sendMail({
          emailAddresses: [x.email as string],
          subject: EmailSubject.SHOUTOUT_RECEIEVED,
          name: x.name,
          celebAlias: x.celebAlias,
          url: x.url,
        });
      } else badEmailUsers.push(x?.userId as string);
    });

    if (badEmailUsers.length > 0) badEmailNotifier(badEmailUsers);
  } catch (err) {
    console.error(err);
    return;
  }
};
export default saveShoutout;
