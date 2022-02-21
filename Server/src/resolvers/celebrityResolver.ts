import { CelebrityInputs, UserResponse } from "../utils/graphqlTypes";
import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Celebrity } from "../entities/Celebrity";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { AppContext } from "../types";
import { getConnection } from "typeorm";
import { upsertSearchItem } from "../appSearch/addSearchItem";

@Resolver()
export class CelebrityResolver {
  cdnUrl = process.env.AWS_CLOUD_FRONT_PUBLIC_DISTRIBUTION_DOMAIN;
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async registerUserasCeleb(
    @Ctx() { req }: AppContext,
    @Arg("data") data: CelebrityInputs
  ) {
    const userId = req.session.userId;
    data.userId = userId;

    if (data.profileObject) {
      data.profileObject = this.cdnUrl + "/" + data.profileObject;
    }
    if (data.profileThumbnail) {
      data.profileThumbnail = this.cdnUrl + "/" + data.profileThumbnail;
    }

    const celeb = Celebrity.create(data);
    await celeb.save();

    await User.update({ userId }, { celebrity: celeb });
    const user = await User.findOne({
      where: { userId },
      relations: ["celebrity"],
    });

    upsertSearchItem(user);

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
    if (data.profileObject) {
      data.profileObject = this.cdnUrl + "/" + data.profileObject;
    }
    if (data.profileThumbnail) {
      data.profileThumbnail = this.cdnUrl + "/" + data.profileThumbnail;
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
    upsertSearchItem(user);

    return { user };
  }

  @Query(() => [User], { nullable: true })
  @UseMiddleware(isAuth)
  async celebrities(
    @Arg("userId", { nullable: true }) userId: string,
    @Arg("limit", () => Int, { nullable: true }) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ) {
    if (userId) {
      const celeb = await User.findOne({
        where: { userId },
        relations: ["celebrity", "celebrity.categoriesConn"],
      });
      // if (celeb?.celebrity?.profileObject) {
      //   celeb.celebrity.profileObject =
      //     this.cdnUrl + "/" + celeb.celebrity.profileObject;
      // }
      // if (celeb?.celebrity?.profileThumbnail) {
      //   celeb.celebrity.profileThumbnail =
      //     this.cdnUrl + "/" + celeb.celebrity.profileThumbnail;
      // }
      return [celeb];
    }
    const maxLimit = Math.min(18, limit);

    const queryBuilder = getConnection()
      .getRepository(User)
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.celebrity", "celebrity")
      .where("user.celebrity is not null")
      .orderBy("celebrity.createdAt", "DESC")
      .take(maxLimit);

    if (cursor) {
      queryBuilder.andWhere('celebrity."createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }
    //
    const celebs = await queryBuilder.getMany();

    // const data = celebs.map((obj) => ({
    //   ...obj,
    //   celebrity: obj.celebrity?.profileObject,
    // }));
    return celebs;
  }
}
