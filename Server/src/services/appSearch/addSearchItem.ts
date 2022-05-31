import { Categories } from "src/entities/Categories";
import { CelebCategories } from "../../entities/CelebCategories";
import { User } from "../../entities/User";
import { client } from "./client";

export const upsertCelebritySearchItem = async (user: User | undefined) => {
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
      image_thumbnail: user.celebrity.imageThumbnail,
      image: user.celebrity.image,
      description: user.celebrity.description,
      profile_hash: user.celebrity.profileHash,
      categories,
    };
    try {
      await client.collections("celebrity").documents().upsert(celebObj);
    } catch (err) {
      console.log("typesense error: ", err);
    }
  }
};

export const upsertCategorySearchItem = async (
  category: Categories[] | undefined
) => {
  if (category) {
    const catObj = category.map((x) => ({
      category_id: x.id,
      category_name: x.name,
    }));
    try {
      await client
        .collections("category")
        .documents()
        .import(catObj, { action: "upsert" });
    } catch (err) {
      console.log("typesense error: ", err);
    }
  }
};
