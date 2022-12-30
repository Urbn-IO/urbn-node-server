import { isEmail } from 'class-validator';
import { Arg, Authorized, Mutation, Resolver } from 'type-graphql';
import { Shoutout } from '../entities/Shoutout';
import { createDeepLink } from '../services/deep_links/dynamicLinks';
import sendMail from '../services/mail/manager';
import { EmailSubject } from '../types';
import { GenericResponse } from '../utils/graphqlTypes';

@Resolver()
export class ShoutoutResolver {
  @Mutation()
  @Authorized()
  async emailShoutout(
    @Arg('shoutoutId') shoutoutId: number,
    @Arg('recipient') email: string
  ): Promise<GenericResponse> {
    if (!isEmail(email)) return { errorMessage: 'Provide a valid email address' };

    const viewerUrl = 'https://urbn-video-player.vercel.app';
    const shoutout = await Shoutout.findOne({ where: { id: shoutoutId } });
    if (!shoutout) return { errorMessage: 'Video not found' };
    const hls = shoutout.hlsUrl;
    const mp4 = shoutout.mp4Url;
    const thumbnail = shoutout.thumbnailUrl;
    const link = `${viewerUrl}?hls=${hls}&mp4=${mp4}&thumbnail=${thumbnail}`;

    const url = await createDeepLink(link, false);
    if (!url) return { errorMessage: 'An error ouccred, try agin later' };

    await sendMail({ emailAddresses: [email], url, subject: EmailSubject.CONFIRM });

    return { success: 'Email sent!' };
  }
}
