import { CacheScope } from 'apollo-server-types';
import { Arg, Int, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql';
import CacheControl from '../cache/cacheControl';
import { AppDataSource } from '../db';
import { Categories } from '../entities/Categories';
import { isAuthenticated } from '../middleware/isAuthenticated';
import { upsertCategorySearchItem } from '../services/search/addSearchItem';
import { CategoryResponse } from '../utils/graphqlTypes';
@Resolver()
export class CategoryResolver {
  @Query(() => [Categories], { nullable: true })
  @CacheControl({ maxAge: 300, scope: CacheScope.Public })
  async getCategories(
    @Arg('categoryId', () => Int, { nullable: true }) id: number,
    @Arg('name', { nullable: true }) name: string,
    @Arg('withCelebs', { defaultValue: false }) withCelebs: boolean,
    @Arg('isPrimary', { defaultValue: false }) primary: boolean,
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string
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
    const queryBuilder = AppDataSource.getRepository(Categories).createQueryBuilder('categories').limit(maxLimit);
    if (primary) {
      queryBuilder.where('categories."primary" = :primary', { primary });
    }

    if (withCelebs) {
      queryBuilder.leftJoinAndSelect('categories.celebConn', 'celebrity').andWhere('celebrity IS NOT NULL');
    }

    if (cursor) {
      if (cursor !== '0') {
        queryBuilder.andWhere('categories."createdAt" < :cursor', {
          cursor: new Date(parseInt(cursor)),
        });
      }
      queryBuilder.orderBy('categories.createdAt', 'DESC');
    } else {
      queryBuilder.orderBy('RANDOM()');
    }
    return await queryBuilder.getMany();
  }
  @Mutation(() => CategoryResponse)
  @UseMiddleware(isAuthenticated)
  async createCategory(
    @Arg('name') name: string,
    @Arg('recommendable') recommendable: boolean
  ): Promise<CategoryResponse> {
    const category = Categories.create({
      name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      recommendable,
    });
    try {
      await category.save();
    } catch (err) {
      return {
        errorMessage: 'An Error occured while creating a category',
      };
    }

    await upsertCategorySearchItem([category]);

    return { category };
  }

  @Mutation(() => Categories, { nullable: true })
  @UseMiddleware(isAuthenticated)
  async updateCategory(@Arg('id', () => Int) id: number, @Arg('name') name: string): Promise<Categories | boolean> {
    const category = await Categories.findOne({ where: { id } });
    if (!category) {
      return false;
    }
    if (typeof name != undefined) {
      category.name = name;
      await Categories.update({ id: category.id }, { name: category.name });
    }
    await upsertCategorySearchItem([category]);
    return category;
  }
}
