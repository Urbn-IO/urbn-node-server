import { CelebCategories } from "../entities/CelebCategories";
import { Arg, Mutation, Resolver } from "type-graphql";

@Resolver()
export class UserCategoriesResolver {
  @Mutation(() => Boolean)
  async mapCelebToCategories(
    @Arg("celebId") celebId: number,
    @Arg("categoryIds", () => [Number]) categoryIds: number[]
  ): Promise<boolean> {
    try {
      for (const categoryId of categoryIds) {
        await CelebCategories.create({ celebId, categoryId }).save();
      }
    } catch (err) {
      return false;
    }

    return true;
  }
}
