import { UserCategories } from "../entities/UserCategories";
import { Arg, Mutation, Query, Resolver } from "type-graphql";

import { User } from "../entities/User";
import { Categories } from "../entities/Categories";

@Resolver()
export class UserCategoriesResolver {
  @Mutation(() => Boolean)
  async mapUserToCategories(
    @Arg("userId") userId: number,
    @Arg("categoryId") categoryId: number
  ): Promise<boolean> {
    try {
      await UserCategories.create({ userId, categoryId }).save();
    } catch (err) {
      return false;
    }

    return true;
  }

  //returns all users with their categories regardless of if the user has been mapped to a category
  @Query(() => [User], { nullable: true })
  async users(): Promise<User[] | null> {
    return User.find();
  }

  //not yet implemented from the enitiy side
  @Query(() => [Categories])
  async categories(): Promise<Categories[]> {
    return Categories.find();
  }
}
