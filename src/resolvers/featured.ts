import { Query, Resolver } from 'type-graphql';
import CacheControl from '../cache/cacheControl';
import { Featured } from '../entities/Featured';
import { FeaturedResponse } from '../utils/graphqlTypes';

@Resolver()
export class ExtrasResolver {
  @Query(() => FeaturedResponse)
  //cache for 1 week
  @CacheControl({ maxAge: 604800 })
  async getFeatured(): Promise<FeaturedResponse> {
    const res = await Featured.findOne({
      where: {
        id: 1,
      },
    });

    if (!res) return { errorMessage: 'No feeatured content at the moment' };

    return { featured: res };
  }
}
