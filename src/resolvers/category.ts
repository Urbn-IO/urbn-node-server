import { Arg, Authorized, Int, Mutation, Query, Resolver } from 'type-graphql';
import CacheControl from 'cache/cacheControl';
import AppDataSource from 'config/ormconfig';
import { Categories } from 'entities/Categories';
import { Celebrity } from 'entities/Celebrity';
import { importCategorySearchItem } from 'services/search/addSearchItem';
import { CategoryResponse } from 'utils/graphqlTypes';
@Resolver()
export class CategoryResolver {
    @Query(() => CategoryResponse, { nullable: true })
    @CacheControl({ maxAge: 300 })
    async getCategoryById(
        @Arg('categoryId', () => Int) id: number,
        @Arg('limit', () => Int, {
            description: 'Number of celebrities associated with category to be fetched per request. Max: 18',
        })
        limit = 8,
        @Arg('cursor', () => String, { nullable: true, description: 'Cursor pagination for celebrities in category' })
        cursor?: string
    ): Promise<CategoryResponse> {
        const category = await Categories.findOne({ where: { id } });
        if (!category) return { errorMessage: 'Category not found' };

        const maxLimit = Math.min(18, limit);
        const dateCursor = cursor ? new Date(parseInt(cursor)) : new Date();

        const celebs = await AppDataSource.getRepository(Celebrity)
            .createQueryBuilder('celebs')
            .innerJoinAndSelect('celebs.categoriesConn', 'c', 'c.categoryId = :catId and celebs.createdAt < :cursor ', {
                catId: category.id,
                cursor: dateCursor,
            })
            .take(maxLimit)
            .getMany();

        //Look for a better solution
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        category.celebs = celebs;

        return { category };
    }

    @Query(() => [Categories], { nullable: true })
    @CacheControl({ maxAge: 300 })
    async getCategories(
        @Arg('limit', () => Int, { description: 'Limit does not apply if isPrimary is set to true' }) limit = 7,
        @Arg('isPrimary', { defaultValue: false }) primary: boolean
    ): Promise<Categories[]> {
        if (primary) {
            const categories = await Categories.find({
                where: {
                    primary,
                },
            });

            return categories;
        }

        const maxLimit = Math.min(7, limit);

        const cat = await AppDataSource.query(
            `
        SELECT "c".*, RANDOM() AS random
        FROM "celeb_categories"
        LEFT JOIN "categories" c
        ON "c"."id" = "celeb_categories"."categoryId"
        WHERE ("celeb_categories"."celebId" IS NOT NULL )
        ORDER BY random
        LIMIT $1
        `,
            [maxLimit]
        );

        const categoriesPromise = cat.map(async (x: { id: number; celebs: Celebrity[] }) => {
            const celebs = await AppDataSource.getRepository(Celebrity)
                .createQueryBuilder('celebs')
                .innerJoinAndSelect('celebs.categoriesConn', 'c', 'c.categoryId = :catId ', {
                    catId: x.id,
                })
                .orderBy('RANDOM()')
                .limit(16)
                .getMany();

            //Look for a better solution
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            x.celebs = celebs;
            return x;
        });

        const categories = await Promise.all(categoriesPromise);

        return categories;
    }
    @Mutation(() => CategoryResponse)
    @Authorized()
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

        await importCategorySearchItem([category]);

        return { category };
    }

    @Mutation(() => Categories, { nullable: true })
    @Authorized()
    async updateCategory(@Arg('id', () => Int) id: number, @Arg('name') name: string): Promise<Categories | boolean> {
        const category = await Categories.findOne({ where: { id } });
        if (!category) {
            return false;
        }
        if (typeof name != undefined) {
            category.name = name;
            await Categories.update({ id: category.id }, { name: category.name });
        }
        await importCategorySearchItem([category]);
        return category;
    }
}
