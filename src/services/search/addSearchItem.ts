import { Categories } from '../../entities/Categories';
import { CelebCategories } from '../../entities/CelebCategories';
import { Celebrity } from '../../entities/Celebrity';
import { client } from './client';

export const upsertCelebritySearchItem = async (celebrity: Celebrity) => {
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
      console.log('typesense error: ', err);
    }
  }
};

export const upsertCelebritySearchBulkImages = async (celebs: Celebrity[]) => {
  if (celebs.length > 0) {
    const celebObj = celebs.map((x) => ({
      id: x.id.toString(),
      profile_hash: x.profileHash,
      thumbnail: x.thumbnail,
      video_banner: x.videoBanner,
      placeholder: x.placeholder,
      low_res_placeholder: x.lowResPlaceholder,
    }));
    try {
      await client.collections('celebrity').documents().import(celebObj, { action: 'upsert' });
    } catch (err) {
      console.log('typesense error: ', err);
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
      console.log('typesense error: ', err);
    }
  }
};
