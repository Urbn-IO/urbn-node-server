import { isAuth } from "../middleware/isAuth";
import {
  Arg,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Categories } from "../entities/Categories";
import { CategoryResponse } from "../utils/graphqlTypes";
import { upsertCategorySearchItem } from "../services/appSearch/addSearchItem";

@Resolver()
export class CategoryResolver {
  @Query(() => [Categories], { nullable: true })
  async categories(
    @Arg("categoryId", { nullable: true }) id: number,
    @Arg("name", { nullable: true }) name: string,
    @Arg("limit", () => Int, { nullable: true }) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ) {
    if (id) {
      const category = await Categories.findOne({ id });
      return [category];
    }
    if (name) {
      const category = await Categories.findOne({
        where: { name },
      });
      return [category];
    }
    const maxLimit = Math.min(18, limit);
    const queryBuilder = getConnection()
      .getRepository(Categories)
      .createQueryBuilder("categories")
      .leftJoinAndSelect("categories.celebConn", "celebrity")
      .orderBy("categories.createdAt", "DESC")
      .take(maxLimit);
    if (cursor) {
      queryBuilder.andWhere('categories."createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }
    return await queryBuilder.getMany();
  }
  @Mutation(() => CategoryResponse)
  @UseMiddleware(isAuth)
  async createCategory(
    @Arg("name") name: string,
    @Arg("recommendable") recommendable: boolean
  ): Promise<CategoryResponse> {
    const category = Categories.create({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      recommendable,
    });
    try {
      await category.save();
    } catch (err) {
      return { errorMessage: "An Error occured while creating a category" };
    }

    upsertCategorySearchItem(category);

    return { category };
  }

  @Mutation(() => Categories, { nullable: true })
  @UseMiddleware(isAuth)
  async updateCategory(
    @Arg("id") id: number,
    @Arg("name") name: string
  ): Promise<Categories | boolean> {
    const category = await Categories.findOne({ id });
    if (!category) {
      return false;
    }
    if (typeof name != undefined) {
      category.name = name;
      await Categories.update({ id: category.id }, { name: category.name });
    }
    upsertCategorySearchItem(category);
    return category;
  }

  // @Mutation(() => Boolean)
  // async deleteCategory(
  //   @Arg("id") id: number,
  //   @Ctx() { em }: AppContext
  // ): Promise<boolean> {
  //   try {
  //     await em.nativeDelete(Categories, { id });
  //     await em.nativeDelete(UserCategories, { categoryId: id });
  //   } catch {
  //     return false;
  //   }
  //   return true;
  // }
}
