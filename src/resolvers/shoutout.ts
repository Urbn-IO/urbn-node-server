import { isEmail } from 'class-validator';
import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql';
import AppDataSource from '../config/ormconfig';
import { SHOUTOUT_PLAYER_URL } from '../constants';
import { User } from '../entities/User';
import sendMail from '../services/aws/email/manager';
import { createDynamicLink } from '../services/deep_links/dynamicLinks';
import { AppContext, EmailSubject } from '../types';
import { GenericResponse } from '../utils/graphqlTypes';

@Resolver()
export class ShoutoutResolver {
  @Mutation(() => GenericResponse)
  @Authorized()
  async emailShoutout(
    @Arg('shoutoutId') shoutoutId: number,
    @Arg('recipientEmail') email: string,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    const userId = req.session.userId as string;
    if (!isEmail(email)) return { errorMessage: 'Provide a valid email address' };

    const viewerUrl = SHOUTOUT_PLAYER_URL;
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .select(['user.id'])
      .leftJoinAndSelect('user.shoutouts', 'shoutouts')
      .where('user.userId = :userId', { userId })
      .getOne();

    if (!user) return { errorMessage: 'An error occured, try again later!' };

    const shoutout = user.shoutouts.find((x) => x.id === shoutoutId);
    if (!shoutout) return { errorMessage: 'An error occured' };
    const hls = shoutout.hlsUrl;
    const mp4 = shoutout.mp4Url;
    const thumbnail = shoutout.thumbnailUrl;
    const link = `${viewerUrl}?hls=${hls}&mp4=${mp4}&thumbnail=${thumbnail}`;

    const url = await createDynamicLink(link, false);
    if (!url) return { errorMessage: 'An error ouccred, try agin later' };

    await sendMail({ emailAddresses: [email], url, subject: EmailSubject.CONFIRM });

    return { success: 'Email sent!' };
  }
}
