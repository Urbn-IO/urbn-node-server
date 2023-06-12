import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { config, STATIC_IMAGE_CDN, STATIC_VIDEO_CDN } from 'constant';
import crypto from 'crypto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PartialWithRequired } from 'types';
import {
  ImageUpload,
  ImageUploadMetadata,
  ImageUploadResponse,
  VideoMetadata,
  VideoUploadResponse,
} from 'utils/graphqlTypes';
dayjs.extend(utc);

const staticImageDistKeyPairId = process.env.AWS_STATIC_IMAGE_DISTRIBUTION_KEYPAIR;
const vodKeyPairId = process.env.AWS_VOD_STATIC_DISTRIBUTION_KEYPAIR;

const pathToPrivateKey = join(config.APP_ROOT, '../keys/private_key.pem');
const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY
  ? process.env.CLOUDFRONT_PRIVATE_KEY
  : readFileSync(pathToPrivateKey, 'utf8');

export const getSignedImageMetadata = (userId: string): ImageUploadResponse => {
  // const duration = 1000 * 60; // 60 secs
  const randomNumber = Math.random().toString();
  const datetime = Date.now();
  const hash = crypto
    .createHash('md5')
    .update(datetime + randomNumber)
    .digest('hex');

  const key = `${userId}/thumbnail/${datetime}-${hash}`;
  const metadataKey = `${userId}/thumbnail/${datetime}-${hash}.json`;

  const metadata: ImageUploadMetadata = { userId, key, type: 'thumbnail' };
  const keys = [key, metadataKey];
  const urls = keys.map((key) => {
    const signedUrl = getSignedUrl({
      url: `https://${STATIC_IMAGE_CDN}/upload/${key}`,
      keyPairId: staticImageDistKeyPairId,
      dateLessThan: dayjs.utc().add(1, 'minute').toString(),
      privateKey,
    });
    return signedUrl as string;
  });

  const imageData: ImageUpload = {
    url: urls[0],
    metadataUrl: urls[1],
    metadata,
  };

  return { data: imageData };
};
export const getSignedVideoMetadata = (
  options: PartialWithRequired<VideoMetadata, 'customMetadata'>
): VideoUploadResponse => {
  const customMetadata = options.customMetadata;
  const userId = customMetadata.userId;
  if (!userId) throw new Error('An error occured');
  const ownedBy = customMetadata.owner ? customMetadata.owner : userId;
  // const duration = 1000 * 60; // 60 secs
  const randomNumber = Math.random().toString();
  const datetime = Date.now();
  const hash = crypto
    .createHash('md5')
    .update(datetime + randomNumber)
    .digest('hex');

  const srcVideo = options.srcVideo;
  const videoKey = srcVideo ? srcVideo : `${ownedBy}/${customMetadata.contentType}/${datetime}-${hash}`;
  const metadataKey = srcVideo
    ? `${srcVideo}.json`
    : `${ownedBy}/${customMetadata.contentType}/${datetime}-${hash}.json`;

  const keys = [videoKey, metadataKey];
  const urls = keys.map((key) => {
    const signedUrl = getSignedUrl({
      url: `https://${STATIC_VIDEO_CDN}/upload/${key}`,
      keyPairId: vodKeyPairId,
      dateLessThan: dayjs.utc().add(1, 'minute').toString(),
      privateKey,
    });
    return signedUrl as string;
  });

  return {
    videoData: {
      videoUrl: urls[0],
      metadataUrl: urls[1],
      metadata: {
        srcVideo: videoKey,
        customMetadata,
        destBucket: options.destBucket,
        cloudFront: options.cloudFront,
        jobTemplate: options.jobTemplate,
      },
    },
  };
};
