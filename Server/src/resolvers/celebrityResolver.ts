import {
  GenericResponse,
  RegisterCelebrityInputs,
  UpdateCelebrityInputs,
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
import { upsertSearchItem } from "../services/appSearch/addSearchItem";
import { hashRow } from "../utils/hashRow";
import { CelebCategories } from "../entities/CelebCategories";

@Resolver()
export class CelebrityResolver {
  cdnUrl = process.env.AWS_CLOUD_FRONT_PUBLIC_DISTRIBUTION_DOMAIN;
  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuth)
  async registerUserAsCeleb(
    @Ctx() { req }: AppContext,
    @Arg("data") data: RegisterCelebrityInputs
  ): Promise<GenericResponse> {
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

      return { success: `${user?.celebrity?.alias} registered successfully` };
    } catch (err) {
      return { errorMessage: "An Error Occured" };
    }
  }

  //update user details
  @Mutation(() => GenericResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async updateCelebDetails(
    @Arg("data") data: UpdateCelebrityInputs,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
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

    if (
      data.acceptsCallTypeA === false &&
      data.acceptsCallTypeB === false &&
      data.acceptShoutOut === false
    ) {
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

    return { success: "updated succesfully!" };
  }

  @Query(() => [Celebrity], { nullable: true })
  async celebrities(
    @Arg("celebId", () => Int, { nullable: true }) celebId: number,
    @Arg("limit", () => Int, { nullable: true }) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ) {
    if (celebId) {
      const celeb = await Celebrity.findOne(celebId);
      if (!celeb) {
        return [];
      }
      return [celeb];
    }
    const maxLimit = Math.min(18, limit);

    const queryBuilder = getConnection()
      .getRepository(Celebrity)
      .createQueryBuilder("celeb")
      .where("celeb.Id is not null")
      .orderBy("celeb.updatedAt", "DESC")
      .take(maxLimit);

    if (cursor) {
      queryBuilder.andWhere('celeb."updatedAt" < :cursor', {
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

      return celebs;
    } catch (err) {
      return [];
    }
  }
}
