import { In } from 'typeorm';
import { Celebrity } from '../../entities/Celebrity';
import { VideoOutput } from '../../types';

const saveVideoBanner = async (data: VideoOutput[]) => {
  try {
    const userIds = data.map((x) => x.userId);
    const celebs = await Celebrity.find({ where: { userId: In(userIds) } });

    if (celebs.length === 0) {
      return;
    }

    const celebObj = data.map((x) => {
      const celeb = celebs.find((y) => y.userId === x.userId) as Celebrity;
      celeb.videoBanner = x.hlsUrl;
      celeb.placeholder = x.thumbnailUrl;
      celeb.lowResPlaceholder = x.lowResPlaceholderUrl;

      return celeb;
    });
    await Celebrity.save(celebObj);
  } catch (err) {
    console.error(err);
    return;
  }
};

export default saveVideoBanner;
