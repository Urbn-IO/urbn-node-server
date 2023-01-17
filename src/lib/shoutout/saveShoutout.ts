import { In } from 'typeorm';
import AppDataSource from '../../config/ormconfig';
import { SHOUTOUT_PLAYER_URL } from '../../constants';
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
    const badEmailUsers: string[] = [];
    const ownerIds = data.map((x) => x.owner);
    const user = await User.find({ where: { userId: In(ownerIds) } });
    if (user.length === 0) {
      return;
    }

    const userIds = user.map((x) => x.userId);

    const emailData = data.map(async (x) => {
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

      const link = `${SHOUTOUT_PLAYER_URL}?hls=${x.hlsUrl}&mp4=${x.mp4Url}&thumbnail=${x.thumbnailUrl}`;
      const url = await createDynamicLink(link, false);
      if (!url) return;
      const data = {
        userId: userObj?.userId,
        name: userObj?.displayName,
        email: userObj?.email,
        isEmailActive: userObj?.isEmailActive,
        celebAlias: x.alias,
        url,
      };
      return data;
    });

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

    const emailDataResolved = await Promise.all(emailData);
    const emailList = emailDataResolved.filter((x) => x);

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
