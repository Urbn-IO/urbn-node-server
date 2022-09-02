import { Query, Resolver } from "type-graphql";
import { CacheControl } from "../cache/cacheControl";
import { INSTANT_SHOUTOUT_MULTIPLIER } from "../constants";
import { Extras } from "../utils/graphqlTypes";
import { CacheScope } from "apollo-server-types";

@Resolver()
export class ExtrasResolver {
  @Query()
  @CacheControl({ maxAge: 86400, scope: CacheScope.Public })
  getExtras(): Extras {
    console.log("sssssssss");
    return {
      bannerMain: "",
      bannerDescription: "",
      bannerSecondary: "",
      shoutoutMultiplier: INSTANT_SHOUTOUT_MULTIPLIER,
    };
  }
}
