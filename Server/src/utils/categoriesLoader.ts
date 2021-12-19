import DataLoader from "dataloader";
import { In } from "typeorm";
import { Categories } from "../entities/Categories";
import { CelebCategories } from "../entities/CelebCategories";

const batchCategories = async (celebIds: readonly number[]) => {
  const celebCategories = await CelebCategories.find({
    join: {
      alias: "celebCategory",
      innerJoinAndSelect: {
        Categories: "celebCategory.category",
      },
    },
    where: {
      celebId: In(celebIds as number[]),
    },
  });

  const celebIdToCategories: { [key: number]: Categories[] } = {};

  celebCategories.forEach((celebCat) => {
    if (celebCat.celebId in celebIdToCategories) {
      celebIdToCategories[celebCat.celebId].push(
        (celebCat as any).__category__
      );
    } else {
      celebIdToCategories[celebCat.celebId] = [(celebCat as any).__category__];
    }
  });
  return celebIds.map((celebId) => celebIdToCategories[celebId]);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createCategoriesLoader = () => new DataLoader(batchCategories);
