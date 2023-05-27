import { APP_BASE_URL } from 'constant';
import { Celebrity } from 'entities/Celebrity';
import { createDynamicLink } from 'services/deep_links/dynamicLinks';
import { importCelebritySearchItemsBulk } from 'services/search/functions';
import { In } from 'typeorm';
import { ImageProcessorQueueOutput } from 'types';
import { hashRow } from 'utils/hashRow';

const storeImages = async (data: ImageProcessorQueueOutput[]) => {
  try {
    data.forEach((x) => delete x.status);

    //remove duplicate entries by using a map which stores the latest value (value with the highest index of the orginal array) as the most updated value for duplicate entries
    const map = new Map();
    data.forEach((x) => map.set(x.userId, x));
    const dedupedData: ImageProcessorQueueOutput[] = [...map.values()];

    const userIds = dedupedData.map((x) => x.userId);
    const celebs = await Celebrity.find({ where: { userId: In(userIds) } });
    const updatedCelebs = celebs.map(async (x) => {
      const filteredFreshData = dedupedData.filter((y) => y.userId === x.userId);
      const freshData = filteredFreshData[0];
      x.profileHash = hashRow(x);
      x.profileUrl = await createDynamicLink(`${APP_BASE_URL}/celebrity/${x.id}`, false, 'celeb', {
        socialTitle: `${x.alias} on Urbn`,
        socialDescription: `Check out ${x.alias} on Urbn`,
        socialImageLink: freshData.thumbnail,
      });
      const result = { ...x, ...freshData };
      return result;
    });

    const resolvedUpdatedCelebs = await Promise.all(updatedCelebs);
    const res = await Celebrity.save(resolvedUpdatedCelebs);
    const celebList = res.filter((x) => {
      if (x.thumbnail && x.videoBanner) return true;
      return false;
    });
    await importCelebritySearchItemsBulk(celebList);
  } catch (err) {
    console.error(err);
    return;
  }
};

export default storeImages;
