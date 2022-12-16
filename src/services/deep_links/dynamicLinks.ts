import { FirebaseDynamicLinks } from 'firebase-dynamic-links';
import { Suffix } from 'firebase-dynamic-links/lib/types/short-links-api';

const appBundle = process.env.APP_BUNDLE_NAME;
const urlPrefix = process.env.APP_DYNAMIC_URL_PREFIX;
const appStoreId = process.env.APPLE_ID;

export const createDeepLink = async (url: string, complex = true) => {
  let suffix: Suffix;
  const firebaseDynamicLinks = new FirebaseDynamicLinks(process.env.FIREBASE_WEBAPI_KEY);
  if (complex) suffix = { option: 'UNGUESSABLE' };
  else suffix = { option: 'SHORT' };

  try {
    const { shortLink, previewLink } = await firebaseDynamicLinks.createLink({
      dynamicLinkInfo: {
        domainUriPrefix: urlPrefix,
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
    return null;
  }
};
