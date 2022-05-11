import { CelebCategories } from "../entities/CelebCategories";
import { Celebrity } from "../entities/Celebrity";

export async function celebCategoriesMapper(
  userId: string,
  categoryIds: number[]
) {
  const celeb = await Celebrity.findOne({
    where: { userId },
    select: ["id"],
  });
  const celebCategoryMap = [];
  const celebId = celeb?.id;
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
