import crypto from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { config, STATIC_IMAGE_CDN, STATIC_VIDEO_CDN } from '../../constants';
import { PartialWithRequired } from '../../types';
import {
  ImageUpload,
  ImageUploadMetadata,
  ImageUploadResponse,
  VideoMetadata,
  VideoUploadResponse,
} from '../../utils/graphqlTypes';
import { Signer } from './cloudFront';

const staticImageDistKeyPairId = process.env.AWS_STATIC_IMAGE_DISTRIBUTION_KEYPAIR;
const vodKeyPairId = process.env.AWS_VOD_STATIC_DISTRIBUTION_KEYPAIR;

const pathToPrivateKey = join(config.APP_ROOT, '../keys/private_key.pem');
const privateKey = existsSync(pathToPrivateKey)
  ? readFileSync(pathToPrivateKey, 'utf8')
  : (process.env.CLOUDFRONT_PRIVATE_KEY as string);

const staticImageSigner = new Signer(staticImageDistKeyPairId, privateKey);
const vodSigner = new Signer(vodKeyPairId, privateKey);

export const getSignedImageMetadata = (userId: string): ImageUploadResponse => {
  const duration = 1000 * 60; // 60 secs
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
    const signedUrl = staticImageSigner.getSignedUrl({
      url: `https://${STATIC_IMAGE_CDN}/upload/${key}`,
      expires: Math.floor((Date.now() + duration) / 1000),
    });
    return signedUrl;
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
  const duration = 1000 * 60; // 60 secs
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
    const signedUrl = vodSigner.getSignedUrl({
      url: `https://${STATIC_VIDEO_CDN}/upload/${key}`,
      expires: Math.floor((Date.now() + duration) / 1000),
    });
    return signedUrl;
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
