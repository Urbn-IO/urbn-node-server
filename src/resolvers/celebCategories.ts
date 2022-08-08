import { CelebCategories } from "../entities/CelebCategories";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { AppContext } from "../types";
import { Celebrity } from "../entities/Celebrity";
import { getConnection } from "typeorm";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { celebCategoriesMapper } from "../utils/celebCategoriesMapper";

@Resolver()
export class UserCategoriesResolver {
  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async mapCelebToCategories(
    @Arg("categoryIds", () => [Number]) categoryIds: number[],
    @Arg("customCategories", () => [String], { nullable: true })
    customCats: string[],
    @Ctx() { req }: AppContext
  ): Promise<boolean> {
    const userId = req.session.userId as string;
    const result = celebCategoriesMapper(userId, categoryIds, customCats);
    return result;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
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
