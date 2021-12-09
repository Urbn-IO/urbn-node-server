import DataLoader from "dataloader";
import { User } from "src/entities/User";
import { In } from "typeorm";
import { UserCategories } from "../entities/UserCategories";

const batchUsers = async (catIds: readonly number[]) => {
  const categoryUsers = await UserCategories.find({
    join: {
      alias: "categoryUsers",
      innerJoinAndSelect: {
        Users: "categoryUsers.user",
      },
    },
    where: {
      categoryId: In(catIds as number[]),
    },
  });

  const CategoryIdToUsers: { [key: number]: User[] } = {};

  categoryUsers.forEach((userCat) => {
    if (userCat.categoryId in CategoryIdToUsers) {
      CategoryIdToUsers[userCat.categoryId].push((userCat as any).__user__);
    } else {
      CategoryIdToUsers[userCat.categoryId] = [(userCat as any).__user__];
    }
  });

  return catIds.map((categoryId) => CategoryIdToUsers[categoryId]);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createUsersLoader = () => new DataLoader(batchUsers);
