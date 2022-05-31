import { upsertCategorySearchItem } from "../services/appSearch/addSearchItem";
import { Categories } from "../entities/Categories";
import { CelebCategories } from "../entities/CelebCategories";
import { Celebrity } from "../entities/Celebrity";

export async function celebCategoriesMapper(
  userId: string,
  categoryIds: number[],
  customCats: string[] | null
) {
  const customCategories = await createCustomCategory(customCats);
  const celebCategoryMap = [];
  if (customCategories) {
    categoryIds.push(...customCategories);
  }
  const celebId = await Celebrity.findOne({
    where: { userId },
    select: ["id"],
  }).then((x) => x?.id);
  try {
    for (const categoryId of categoryIds) {
      const celebCategory = CelebCategories.create({ celebId, categoryId });
      celebCategoryMap.push(celebCategory);
    }
    await CelebCategories.save(celebCategoryMap);
  } catch (err) {
    return false;
  }

  return true;
}

async function createCustomCategory(customCats: string[] | null) {
  if (customCats) {
    let newCategories;
    const categoryList = [];
    for (const name of customCats) {
      const category = Categories.create({
        name: name.charAt(0).toUpperCase() + name.slice(1),
      });
      categoryList.push(category);
    }
    try {
      newCategories = await Categories.save(categoryList);
      upsertCategorySearchItem(newCategories);
      const catIds = newCategories.map((x) => x.id);
      return catIds;
    } catch (err) {
      return null;
    }
  }
  return null;
}
