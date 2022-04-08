import {
  RegisterCelebrityInputs,
  UpdateCelebrityInputs,
  UserResponse,
} from "../utils/graphqlTypes";
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
  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async registerUserasCeleb(
    @Ctx() { req }: AppContext,
    @Arg("data") data: RegisterCelebrityInputs
  ): Promise<UserResponse> {
    const userId = req.session.userId;
    data.userId = userId;
    const thumbnail = data.thumbnail;
    const image = `${data.image}_image.webp`;
    const imageThumbnail = `${data.image}_thumbnail.webp`;
    const imagePlaceholder = `${data.image}_placeholder.webp`;
    const maxRate = 50000000;

    if (
      parseInt(data._3minsCallRequestRatesInNaira) > maxRate ||
      parseInt(data._5minsCallRequestRatesInNaira) > maxRate ||
      parseInt(data.shoutOutRatesInNaira) > maxRate
    ) {
      return {
        errors: [
          {
            errorMessage: "Maximum price rate for any request exceeded",
            field: "",
          },
        ],
      };
    }

    if (data.image) {
      data.image = `${this.cdnUrl}/${image}`;
      data.imageThumbnail = `${this.cdnUrl}/${imageThumbnail}`;
      data.imagePlaceholder = `${this.cdnUrl}/${imagePlaceholder}`;
    }
    if (data.thumbnail) {
      data.thumbnail = `${this.cdnUrl}/${thumbnail}.webp`;
    }

    try {
      const celeb = Celebrity.create(data);
      await celeb.save();

      await User.update({ userId }, { celebrity: celeb });
      const user = await User.findOne({
        where: { userId },
        relations: ["celebrity"],
      });

      upsertSearchItem(user);

      return { user };
    } catch (err) {
      return {
        errors: [{ errorMessage: "An Error Occured", field: "" }],
      };
    }
  }

  //update user details
  @Mutation(() => UserResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async updateCelebDetails(
    @Arg("data") data: UpdateCelebrityInputs,
    @Ctx() { req }: AppContext
  ): Promise<UserResponse> {
    const userId = req.session.userId;
    const thumbnail = data.thumbnail;
    const image = `${data.image}_image.webp`;
    const imageThumbnail = `${data.image}_thumbnail.webp`;
    const imagePlaceholder = `${data.image}_placeholder.webp`;
    const maxRate = 50000000;

    if (
      parseInt(data._3minsCallRequestRatesInNaira) > maxRate ||
      parseInt(data._5minsCallRequestRatesInNaira) > maxRate ||
      parseInt(data.shoutOutRatesInNaira) > maxRate
    ) {
      return {
        errors: [
          {
            errorMessage: "Maximum price rate for any request exceeded",
            field: "",
          },
        ],
      };
    }

    if (data.acceptsCalls === false && data.acceptShoutOut === false) {
      return {
        errors: [
          {
            field: "acceptsCallRequets | acceptShoutOut",
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
    if (data.image) {
      data.image = `${this.cdnUrl}/${image}`;
      data.imageThumbnail = `${this.cdnUrl}/${imageThumbnail}`;
      data.imagePlaceholder = `${this.cdnUrl}/${imagePlaceholder}`;
    }
    if (data.thumbnail) {
      data.thumbnail = `${this.cdnUrl}/${thumbnail}.webp`;
    }

    await Celebrity.update({ userId }, data);
    const user = await getConnection()
      .getRepository(User)
      .createQueryBuilder("user")
      .where("user.userId = :userId", { userId })
      .leftJoinAndSelect("user.celebrity", "celebrity")
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
