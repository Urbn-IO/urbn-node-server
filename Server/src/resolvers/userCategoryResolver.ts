import { UserCategories } from "src/entities/UserCategories";
import { Arg, Mutation, Resolver } from "type-graphql";

@Resolver()
export class UserCategoriesResolver {
  @Mutation(() => Boolean)
  async addUserCategory(
    @Arg("userId") userId: number,
    @Arg("categoryId") categoryId: number
  ): Promise<boolean> {
    await UserCategories.create({ userId, categoryId }).save();
    return true;
  }
}
