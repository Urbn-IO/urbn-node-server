import { In } from "typeorm";
import { Celebrity } from "../../entities/Celebrity";
import { upsertCelebritySearchBulkImages } from "../../services/search/addSearchItem";
import { ImageProcessorQueueOutput } from "../../types";
import { hashRow } from "../../utils/hashRow";

const storeImages = async (data: ImageProcessorQueueOutput[]) => {
  data.forEach((x) => delete x.status);

  //remove duplicate entries by using a map which stores the latest value (value with the highest index of the orginal array) as the most updated value for duplicate entries
  const map = new Map();
  data.forEach((x) => map.set(x.userId, x));
  const dedupedData: ImageProcessorQueueOutput[] = [...map.values()];

  const userIds = dedupedData.map((x) => x.userId);
  const celebs = await Celebrity.find({ where: { userId: In(userIds) } });
  const updatedCelebs = celebs.map((x) => {
    const filteredFreshData = dedupedData.filter((y) => y.userId === x.userId);
    const freshData = filteredFreshData[0];
    x.profileHash = hashRow(x);
    const result = { ...x, ...freshData };
    return result;
  });
  const res = await Celebrity.save(updatedCelebs);
  await upsertCelebritySearchBulkImages(res);
};

export default storeImages;
