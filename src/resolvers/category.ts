import { isAuthenticated } from "../middleware/isAuthenticated";
import { Arg, Int, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Categories } from "../entities/Categories";
import { CategoryResponse } from "../utils/graphqlTypes";
import { upsertCategorySearchItem } from "../services/search/addSearchItem";
import { AppDataSource } from "../db";
@Resolver()
export class CategoryResolver {
  @Query(() => [Categories], { nullable: true })
  async getCategories(
    @Arg("categoryId", () => Int, { nullable: true }) id: number,
    @Arg("name", { nullable: true }) name: string,
    @Arg("withCelebs", { defaultValue: false }) withCelebs: boolean,
    @Arg("isPrimary", { defaultValue: false }) primary: boolean,
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string
  ) {
    if (id) {
      const category = await Categories.findOne({ where: { id } });
      if (!category) return [];
      return [category];
    }
    if (name) {
      const category = await Categories.findOne({
        where: { name },
      });
      if (!category) return [];
      return [category];
    }
    const maxLimit = Math.min(18, limit);
    const queryBuilder = AppDataSource.getRepository(Categories).createQueryBuilder("categories").limit(maxLimit);

    if (primary) {
      queryBuilder.where('categories."primary" = :primary', { primary });
    }

    if (withCelebs) {
      queryBuilder.leftJoinAndSelect("categories.celebConn", "celebrity").andWhere("celebrity IS NOT NULL");
    }

    if (cursor) {
      if (cursor !== "0") {
        queryBuilder.andWhere('categories."createdAt" < :cursor', {
          cursor: new Date(parseInt(cursor)),
        });
      }
      queryBuilder.orderBy("categories.createdAt", "DESC");
    } else {
      queryBuilder.orderBy("RANDOM()");
    }
    return await queryBuilder.getMany();
  }
  @Mutation(() => CategoryResponse)
  @UseMiddleware(isAuthenticated)
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

    upsertCategorySearchItem([category]);

    return { category };
  }

  @Mutation(() => Categories, { nullable: true })
  @UseMiddleware(isAuthenticated)
  async updateCategory(@Arg("id", () => Int) id: number, @Arg("name") name: string): Promise<Categories | boolean> {
    const category = await Categories.findOne({ where: { id } });
    if (!category) {
      return false;
    }
    if (typeof name != undefined) {
      category.name = name;
      await Categories.update({ id: category.id }, { name: category.name });
    }
    upsertCategorySearchItem([category]);
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