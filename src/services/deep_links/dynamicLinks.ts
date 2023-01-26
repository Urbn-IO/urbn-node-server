import { FirebaseDynamicLinks } from 'firebase-dynamic-links';
import { SocialMetaTagInfo, Suffix } from 'firebase-dynamic-links/lib/types/short-links-api';
import {
  APP_BUNDLE_NAME,
  APP_CELEBRITY_DYNAMIC_URL_PREFIX,
  APP_MAIN_DYNAMIC_URL_PREFIX,
  APP_SHOUTOUT_DYNAMIC_URL_PREFIX,
} from '../../constants';

const appBundle = APP_BUNDLE_NAME;
const appStoreId = process.env.APPLE_ID;

export const createDynamicLink = async (
  url: string,
  complex = true,
  prefix: 'main' | 'celeb' | 'shoutout' = 'main',
  socialMetaTagInfo?: SocialMetaTagInfo
) => {
  const urlPrefix =
    prefix === 'main'
      ? APP_MAIN_DYNAMIC_URL_PREFIX
      : prefix === 'celeb'
      ? APP_CELEBRITY_DYNAMIC_URL_PREFIX
      : APP_SHOUTOUT_DYNAMIC_URL_PREFIX;

  const firebaseDynamicLinks = new FirebaseDynamicLinks(process.env.FIREBASE_WEBAPI_KEY);
  const suffix: Suffix = complex ? { option: 'UNGUESSABLE' } : { option: 'SHORT' };

  try {
    const { shortLink, previewLink } = await firebaseDynamicLinks.createLink({
      dynamicLinkInfo: {
        domainUriPrefix: urlPrefix,
        socialMetaTagInfo,
        link: url,
        androidInfo: {
          androidPackageName: appBundle,
        },
        iosInfo: {
          iosBundleId: appBundle,
          iosAppStoreId: appStoreId,
        },
      },
      suffix,
    });
    console.log(shortLink);
    console.log(previewLink);
    return shortLink;
  } catch (err) {
    console.log(err);
    return undefined;
  }
};
