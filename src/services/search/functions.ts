import { Categories } from 'entities/Categories';
import { CelebCategories } from 'entities/CelebCategories';
import { Celebrity } from 'entities/Celebrity';
import { In } from 'typeorm';
import { client } from './client';

export const upsertCelebritySearchItems = async (celebrity: Celebrity) => {
  if (celebrity) {
    const celebId = celebrity.id;
    const categoriesObj = await CelebCategories.find({
      join: {
        alias: 'celebCategory',
        innerJoinAndSelect: {
          Celebrity: 'celebCategory.category',
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
      placeholder: celebrity.placeholder,
      low_res_placeholder: celebrity.lowResPlaceholder,
      video_banner: celebrity.videoBanner,
      description: celebrity.description,
      profile_hash: celebrity.profileHash,
      categories,
    };
    try {
      await client.collections('celebrity').documents().upsert(celebObj);
    } catch (err) {
      console.error('typesense error: ', err);
    }
  }
};

export const importCelebritySearchItemsBulk = async (celebs: Celebrity[]) => {
  if (celebs.length > 0) {
    const celebIds = celebs.map((x) => x.id);
    const categoriesObj = await CelebCategories.find({
      join: {
        alias: 'celebCategory',
        innerJoinAndSelect: {
          Celebrity: 'celebCategory.category',
        },
      },
      where: {
        celebId: In(celebIds),
      },
    });

    const celebObj = celebs.map((x) => {
      const categories = categoriesObj.filter((y) => y.celebId === x.id).map((z) => (z as any).__category__.name);
      return {
        id: x.id.toString(),
        alias: x.alias,
        thumbnail: x.thumbnail,
        placeholder: x.placeholder,
        low_res_placeholder: x.lowResPlaceholder,
        video_banner: x.videoBanner,
        description: x.description,
        profile_hash: x.profileHash,
        categories,
      };
    });
    try {
      await client.collections('celebrity').documents().import(celebObj, { action: 'upsert' });
    } catch (err) {
      console.error('typesense error: ', err);
    }
  }
};

export const upsertCategorySearchItem = async (category: Categories[] | undefined) => {
  if (category && category.length > 0) {
    const catObj = category.map((x) => ({
      category_id: x.id,
      category_name: x.name,
    }));
    try {
      await client.collections('category').documents().import(catObj, { action: 'upsert' });
    } catch (err) {
      console.error('typesense error: ', err);
    }
  }
};

export const deleteCelebritySearchItem = async (id: number) => {
  try {
    await client.collections('celebrity').documents(id.toString()).delete();
  } catch (err) {
    console.error('typesense error: ', err);
  }
};
