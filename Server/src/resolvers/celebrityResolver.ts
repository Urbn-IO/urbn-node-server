import { CreateCelebrityInputs } from "../utils/graphqlTypes";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Celebrity } from "../entities/Celebrity";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { AppContext } from "../types";
import { getConnection, IsNull, Not } from "typeorm";

@Resolver()
export class CelebrityResolver {
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async registerUserasCeleb(
    @Ctx() { req }: AppContext,
    @Arg("celebrity") celebrity: CreateCelebrityInputs
  ) {
    const userId = req.session.userId;
    celebrity.userId = userId;

    const celeb = Celebrity.create(celebrity);
    await celeb.save();

    await User.update({ userId }, { celebrity: celeb });
    await getConnection().query(
      'delete from "celebrity" "Celebrity" where id not in (select "celebrityId" from "user" "User" where "celebrityId" is not null)'
    );
    return true;
  }

  @Query(() => [User], { nullable: true })
  @UseMiddleware(isAuth)
  async celebrities(@Arg("userId", { nullable: true }) userId: string) {
    if (userId) {
      const celeb = await User.findOne({
        where: { userId: userId },
        relations: ["celebrity"],
      });
      return [celeb];
    }
    return await User.find({
      where: { celebrity: Not(IsNull()) },
      relations: ["celebrity"],
    });
  }
}
