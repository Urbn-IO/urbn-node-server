import { CelebCategories } from "../../entities/CelebCategories";
import { User } from "../../entities/User";
import { client } from "./client";

export const upsertSearchItem = async (user: User | undefined) => {
  if (user?.celebrity) {
    const celebId = user.celebrity.id;
    const categoriesObj = await CelebCategories.find({
      join: {
        alias: "celebCategory",
        innerJoinAndSelect: {
          Celebrity: "celebCategory.category",
        },
      },
      where: {
        celebId,
      },
    });

    const categories: CelebCategories[] = [];
    categoriesObj.forEach((x) => {
      const category = (x as any).__category__.name;
      categories.push(category);
    });

    const celebObj = {
      id: user.celebrity.id.toString(),
      user_id: user.userId,
      first_name: user.firstName,
      last_name: user.lastName,
      alias: user.celebrity.alias,
      thumbnail: user.celebrity.thumbnail,
      image_placeholder: user.celebrity.imagePlaceholder,
      description: user.celebrity.description,
      categories,
    };
    try {
      await client.collections("celebrity").documents().upsert(celebObj);
    } catch (err) {
      console.log("typesense error: ", err);
    }
  }
};
