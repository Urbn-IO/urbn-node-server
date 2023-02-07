import CacheControl from 'cache/cacheControl';
import { Featured } from 'entities/Featured';
import { Query, Resolver } from 'type-graphql';

@Resolver()
export class ExtrasResolver {
  @Query(() => [Featured])
  //cache for 1 week
  @CacheControl({ maxAge: 604800 })
  async getFeatured(): Promise<Featured[]> {
    return await Featured.find();
  }
}
