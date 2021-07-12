import { Mycontext } from "src/types";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { Categories } from "src/entities/Categories";
import { UserCategories } from "src/entities/UserCategories";
import { groupEnd } from "console";

@Resolver()
export class CategoryResolver {
  @Query(() => [Categories], { nullable: true })
  allCategories(@Ctx() { em }: Mycontext): Promise<Categories[] | null> {
    return em.find(Categories, {});
  }

  @Query(() => Categories, { nullable: true })
  findCategory(
    @Arg("id") id: number,
    @Ctx() { em }: Mycontext
  ): Promise<Categories | null> {
    return em.findOne(Categories, { id });
  }

  @Mutation(() => Categories)
  async createCategory(
    @Arg("name") name: string,
    @Arg("recommendable") recommendable: boolean,
    @Ctx() { em }: Mycontext
  ): Promise<Categories> {
    const category = em.create(Categories, { name, recommendable });
    await em.persistAndFlush(category);
    return category;
  }

  @Mutation(() => Categories, { nullable: true })
  async updateCategory(
    @Arg("id") id: number,
    @Arg("name") name: string,
    @Ctx() { em }: Mycontext
  ): Promise<Categories | null> {
    const category = await em.findOne(Categories, { id });
    if (!category) {
      return null;
    }
    if (typeof name != undefined) {
      category.name = name;
      await em.persistAndFlush(category);
    }

    return category;
  }

  @Mutation(() => Boolean)
  async deleteCategory(
    @Arg("id") id: number,
    @Ctx() { em }: Mycontext
  ): Promise<boolean> {
    try {
      await em.nativeDelete(Categories, { id });
      await em.nativeDelete(UserCategories, { categoryId: id });
    } catch {
      return false;
    }
    return true;
  }
}
