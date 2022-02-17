import { CelebrityInputs, UserResponse } from "../utils/graphqlTypes";
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
    @Arg("celebrity") celebrity: CelebrityInputs
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

  //update user details
  @Mutation(() => UserResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async updateCelebDetails(
    @Arg("data") data: CelebrityInputs,
    @Ctx() { req }: AppContext
  ): Promise<UserResponse> {
    const userId = req.session.userId;
    if (
      data.acceptsCallRequets === false &&
      data.acceptsVideoRequests === false
    ) {
      return {
        errors: [
          {
            field: "acceptsCallRequets | acceptsVideoRequests",
            errorMessage: "Minimum of one request type must be selected",
          },
        ],
      };
    }
    if (Object.keys(data).length === 0) {
      return {
        errors: [
          {
            field: "data",
            errorMessage: "Nothing to update",
          },
        ],
      };
    }

    await Celebrity.update({ userId }, data);
    const user = await getConnection()
      .getRepository(User)
      .createQueryBuilder("user")
      .leftJoinAndSelect(
        "user.celebrity",
        "celebrity",
        "celebrity.userId = :userId",
        { userId }
      )
      .getOne();

    return { user };
  }

  @Query(() => [User], { nullable: true })
  @UseMiddleware(isAuth)
  async celebrities(@Arg("userId", { nullable: true }) userId: string) {
    if (userId) {
      const celeb = await User.findOne({
        where: { userId },
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
