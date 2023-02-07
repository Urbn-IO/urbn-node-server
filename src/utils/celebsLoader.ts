import DataLoader from 'dataloader';
import { In } from 'typeorm';
import { CelebCategories } from 'entities/CelebCategories';
import { Celebrity } from 'entities/Celebrity';

const batchCelebs = async (catIds: readonly number[]) => {
  const categoryCelebrities = await CelebCategories.find({
    join: {
      alias: 'categoryCelebrities',
      innerJoinAndSelect: {
        Celebrity: 'categoryCelebrities.celebrity',
      },
    },
    where: {
      categoryId: In(catIds as number[]),
    },
  });

  const CategoryIdToCeleb: { [key: number]: Celebrity[] } = {};

  categoryCelebrities.forEach((celebCat) => {
    if (celebCat.categoryId in CategoryIdToCeleb) {
      CategoryIdToCeleb[celebCat.categoryId].push((celebCat as any).__celebrity__);
    } else {
      CategoryIdToCeleb[celebCat.categoryId] = [(celebCat as any).__celebrity__];
    }
  });

  return catIds.map((categoryId) => CategoryIdToCeleb[categoryId]);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createCelebsLoader = () => new DataLoader(batchCelebs);
