import DataLoader from "dataloader";
import { In } from "typeorm";
import { Categories } from "../entities/Categories";
import { UserCategories } from "../entities/UserCategories";

const batchCategories = async (userIds: readonly number[]) => {
  const userCategories = await UserCategories.find({
    join: {
      alias: "userCategory",
      innerJoinAndSelect: {
        Categories: "userCategory.category",
      },
    },
    where: {
      userId: In(userIds as number[]),
    },
  });

  const userIdToCategories: { [key: number]: Categories[] } = {};

  userCategories.forEach((userCat) => {
    if (userCat.userId in userIdToCategories) {
      userIdToCategories[userCat.userId].push((userCat as any).__category__);
    } else {
      userIdToCategories[userCat.userId] = [(userCat as any).__category__];
    }
  });

  return userIds.map((userId) => userIdToCategories[userId]);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createCategoriesLoader = () => new DataLoader(batchCategories);
