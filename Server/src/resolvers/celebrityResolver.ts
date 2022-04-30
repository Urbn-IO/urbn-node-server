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
import { getConnection, In, Not } from "typeorm";
import { upsertSearchItem } from "../services/appSearch/addSearchItem";
import { hashRow } from "../utils/hashRow";
import { CelebCategories } from "../entities/CelebCategories";

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
      return { errorMessage: "Maximum price rate for any request exceeded" };
    }

    if (data.image) {
      data.image = `${this.cdnUrl}/${image}`;
      data.imageThumbnail = `${this.cdnUrl}/${imageThumbnail}`;
      data.imagePlaceholder = `${this.cdnUrl}/${imagePlaceholder}`;
    }
    if (data.thumbnail) {
      data.thumbnail = `${this.cdnUrl}/${thumbnail}.webp`;
    }
    const hashString = hashRow(data);
    data.profileHash = hashString;

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
      return { errorMessage: "An Error Occured" };
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
      return { errorMessage: "Maximum price rate for any request exceeded" };
    }

    if (data.acceptsCalls === false && data.acceptShoutOut === false) {
      return { errorMessage: "Minimum of one request type must be selected" };
    }
    if (Object.keys(data).length === 0) {
      return { errorMessage: "Nothing to update" };
    }
    if (data.image) {
      data.image = `${this.cdnUrl}/${image}`;
      data.imageThumbnail = `${this.cdnUrl}/${imageThumbnail}`;
      data.imagePlaceholder = `${this.cdnUrl}/${imagePlaceholder}`;
    }
    if (data.thumbnail) {
      data.thumbnail = `${this.cdnUrl}/${thumbnail}.webp`;
    }

    const hashString = hashRow(data);
    data.profileHash = hashString;

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

  @Query(() => [Celebrity])
  @UseMiddleware(isAuth)
  async similarToCelebrity(
    @Arg("celebId") celebId: number,
    @Arg("limit", () => Int) limit: number
  ) {
    const maxLimit = Math.min(8, limit);
    try {
      const catIds = [];
      const categoryObj = await getConnection()
        .getRepository(CelebCategories)
        .createQueryBuilder("celebCat")
        .select("celebCat.categoryId")
        .where("celebCat.celebId = :celebId", { celebId })
        .getMany();

      for (const item of categoryObj) {
        catIds.push(item.categoryId);
      }
      console.log(catIds);
      // const celebsObj = await getConnection()
      //   .getRepository(CelebCategories)
      //   .createQueryBuilder("celebCat")
      //   .leftJoinAndSelect("celebCat.celebrity", "celebrity")
      //   // .orderBy("RANDOM()")
      //   .where("celebCat.celebId != :celebId", { celebId })
      //   .andWhere("celebCat.categoryId in (:...catIds)", { catIds })
      //   .take(maxLimit)
      //   .getMany();

      // const celebsObj = await CelebCategories.find({
      //   relations: ["celebrity"],
      //   where: { celebId: Not(celebId), categoryId: In(catIds) },
      //   take: maxLimit,
      //   order: { celebId: "ASC" },
      // });

      // const query = await getConnection().query(
      //   `
      // SELECT DISTINCT "celebrity"."alias", MIN(RANDOM()) as rand
      // FROM "celeb_categories"
      // LEFT JOIN "celebrity"
      // ON "celebrity"."id" = "celeb_categories"."celebId"
      // WHERE ("celeb_categories"."celebId" != $1 AND "celeb_categories"."categoryId" = ANY ($2) )
      // ORDER BY rand
      // LIMIT $3
      // `,
      //   [celebId, catIds, maxLimit]
      // );
      const celebs = await getConnection().query(
        `
      SELECT "c".*, RANDOM() AS random
      FROM "celeb_categories"
      LEFT JOIN "celebrity" c
      ON "c"."id" = "celeb_categories"."celebId"
      WHERE ("celeb_categories"."celebId" != $1 AND "celeb_categories"."categoryId" = ANY ($2) )
      GROUP BY "c"."id", "c"."userId"
      ORDER BY random
      LIMIT $3
      `,
        [celebId, catIds, maxLimit]
      );

      // for (const item of celebsObj) {
      //   celebs.push(item.celebrity);
      // }

      return celebs;
    } catch (err) {
      return [];
    }
  }
}
