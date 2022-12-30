import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql';
import { AppDataSource } from '../db';
import { CelebCategories } from '../entities/CelebCategories';
import { Celebrity } from '../entities/Celebrity';
import { AppContext } from '../types';
import { celebCategoriesMapper } from '../utils/celebCategoriesMapper';

@Resolver()
export class UserCategoriesResolver {
  @Mutation(() => Boolean)
  @Authorized()
  async mapCelebToCategories(
    @Arg('categoryIds', () => [Number]) categoryIds: number[],
    @Arg('customCategories', () => [String], { nullable: true })
    customCats: string[],
    @Ctx() { req }: AppContext
  ): Promise<boolean> {
    const userId = req.session.userId as string;
    const result = celebCategoriesMapper(userId, categoryIds, customCats);
    return result;
  }

  @Mutation(() => Boolean)
  @Authorized()
  async detachCelebFromCategories(
    @Arg('categoryIds', () => [Number]) categoryIds: number[],
    @Ctx() { req }: AppContext
  ): Promise<boolean> {
    const userId = req.session.userId;
    const celeb = await Celebrity.findOne({
      where: { userId },
      select: ['id'],
    });
    const celebId = celeb?.id;
    try {
      AppDataSource.createQueryBuilder()
        .delete()
        .from(CelebCategories)
        .where('celebId = :celebId', { celebId })
        .andWhere('categoryId = ANY(:categoryIds)', { categoryIds })
        .execute();
    } catch (err) {
      return false;
    }

    return true;
  }
}
