import { Categories } from "src/entities/Categories";
import { CelebCategories } from "../../entities/CelebCategories";
import { Celebrity } from "../../entities/Celebrity";
import { client } from "./client";

export const upsertCelebritySearchItem = async (celebrity: Celebrity | null) => {
  if (celebrity) {
    const celebId = celebrity.id;
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
      id: celebrity.id.toString(),
      alias: celebrity.alias,
      thumbnail: celebrity.thumbnail,
      image_placeholder: celebrity.imagePlaceholder,
      image_thumbnail: celebrity.imageThumbnail,
      image: celebrity.image,
      description: celebrity.description,
      profile_hash: celebrity.profileHash,
      categories,
    };
    try {
      await client.collections("celebrity").documents().upsert(celebObj);
    } catch (err) {
      console.log("typesense error: ", err);
    }
  }
};

export const upsertCategorySearchItem = async (category: Categories[] | undefined) => {
  if (category) {
    const catObj = category.map((x) => ({
      category_id: x.id,
      category_name: x.name,
    }));
    try {
      await client.collections("category").documents().import(catObj, { action: "upsert" });
    } catch (err) {
      console.log("typesense error: ", err);
    }
  }
};
