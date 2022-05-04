import { CelebCategories } from "../entities/CelebCategories";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { AppContext } from "../types";
import { Celebrity } from "../entities/Celebrity";
import { getConnection } from "typeorm";
import { isAuth } from "../middleware/isAuth";

@Resolver()
export class UserCategoriesResolver {
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async mapCelebToCategories(
    @Arg("categoryIds", () => [Number]) categoryIds: number[],
    @Ctx() { req }: AppContext
  ): Promise<boolean> {
    const userId = req.session.userId;
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

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async detachCelebFromCategories(
    @Arg("categoryIds", () => [Number]) categoryIds: number[],
    @Ctx() { req }: AppContext
  ): Promise<boolean> {
    const userId = req.session.userId;
    const celeb = await Celebrity.findOne({
      where: { userId },
      select: ["id"],
    });
    const celebId = celeb?.id;
    try {
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(CelebCategories)
        .where("celebId = :celebId", { celebId })
        .andWhere("categoryId = ANY(:categoryIds)", { categoryIds })
        .execute();
    } catch (err) {
      return false;
    }

    return true;
  }
}
