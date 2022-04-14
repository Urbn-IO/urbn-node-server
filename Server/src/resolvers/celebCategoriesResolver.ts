import { CelebCategories } from "../entities/CelebCategories";
import { Arg, Mutation, Resolver } from "type-graphql";

@Resolver()
export class UserCategoriesResolver {
  @Mutation(() => Boolean)
  async mapCelebToCategories(
    @Arg("celebId") celebId: number,
    @Arg("categoryId") categoryId: number
  ): Promise<boolean> {
    try {
      await CelebCategories.create({ celebId, categoryId }).save();
    } catch (err) {
      return false;
    }

    return true;
  }
}
