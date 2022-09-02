import {
  CallScheduleInput,
  CelebrityPreregistrationInputs,
  GenericResponse,
  RegisterCelebrityInputs,
  UpdateCelebrityInputs,
} from "../utils/graphqlTypes";
import { Arg, Ctx, Int, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Celebrity } from "../entities/Celebrity";
import { User } from "../entities/User";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { AppContext } from "../types";
import { hashRow } from "../utils/hashRow";
import { CelebCategories } from "../entities/CelebCategories";
import { upsertCelebritySearchItem } from "../services/search/addSearchItem";
import { scheduleCallSlot, updateCallSlot } from "../scheduler/videoCallScheduler";
import { CallScheduleBase } from "../entities/CallScheduleBase";
import { CacheControl } from "../cache/cacheControl";
import { CacheScope } from "apollo-server-types";
import { AppDataSource } from "../db";
import { attachInstantShoutoutPrice } from "../utils/helpers";
import { CelebrityRegistration } from "../entities/CelebrityRegistrations";
import { CELEB_PREREGISTRATION_PREFIX } from "../constants";

@Resolver()
export class CelebrityResolver {
  cdnUrl = process.env.AWS_CLOUD_FRONT_PUBLIC_DISTRIBUTION_DOMAIN;

  @Mutation(() => String)
  @UseMiddleware(isAuthenticated)
  async celebPreregistration(
    @Arg("input") input: CelebrityPreregistrationInputs,
    @Ctx() { req, redis }: AppContext
  ): Promise<string> {
    const userId = req.session.userId;
    if (!input.facebook && !input.instagram && !input.twitter && !input.phoneNumber) {
      return "You must provide at least one (1) medium to verify your claim";
    }
    const exists = await redis.get(CELEB_PREREGISTRATION_PREFIX + userId);
    if (exists) return "Seems like you applied recently, try again a week from when you made your initial application";
    try {
      const user = await User.findOne({ where: { userId }, select: ["email"] });
      if (!user) throw new Error("An error occured while trying to find the user on the database");
      await CelebrityRegistration.create({
        email: user.email,
        alias: input.alias,
        facebook: input.facebook,
        instagram: input.instagram,
        twitter: input.twitter,
        phoneNumber: input.phoneNumber,
      }).save();
      await redis.set(CELEB_PREREGISTRATION_PREFIX + userId, userId as string, "EX", 3600 * 24 * 7);
      return "Success!🔥 You'll hear from us soon";
    } catch (err) {
      return "Request Failed. An error occured";
    }
  }

  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuthenticated)
  async registerUserAsCeleb(
    @Ctx() { req }: AppContext,
    @Arg("data") data: RegisterCelebrityInputs
  ): Promise<GenericResponse> {
    const userId = req.session.userId as string;
    data.userId = userId;
    if (data.acceptsCallTypeA === false && data.acceptsCallTypeB === false && data.acceptsShoutout === false) {
      return { errorMessage: "You have to accept at least one type of request" };
    }
    const hashString = hashRow(data);
    data.profileHash = hashString;
    try {
      const celeb = Celebrity.create(data as Celebrity);
      const celebrity = await celeb.save();

      await User.update({ userId }, { celebrity });
      return { success: `Soft creation for ${celebrity.alias} successful` };
    } catch (err) {
      return { errorMessage: "An Error Occured" };
    }
  }

  //update celeb details
  @Mutation(() => GenericResponse, { nullable: true })
  @UseMiddleware(isAuthenticated)
  async updateCelebDetails(
    @Arg("data") data: UpdateCelebrityInputs,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    const userId = req.session.userId as string;
    if (Object.keys(data).length === 0) {
      return { errorMessage: "Nothing to update" };
    }

    if (data.acceptsCallTypeA === false && data.acceptsCallTypeB === false && data.acceptsShoutout === false) {
      return { errorMessage: "You have to accept at least one type of request" };
    }

    if (data.image) {
      const image = `${data.image}_image.webp`;
      const imageThumbnail = `${data.image}_thumbnail.webp`;
      const imagePlaceholder = `${data.image}_placeholder.webp`;
      data.image = `${this.cdnUrl}/${image}`;
      data.imageThumbnail = `${this.cdnUrl}/${imageThumbnail}`;
      data.imagePlaceholder = `${this.cdnUrl}/${imagePlaceholder}`;
    }
    if (data.thumbnail) {
      const thumbnail = data.thumbnail;
      data.thumbnail = `${this.cdnUrl}/${thumbnail}.webp`;
    }
    const hashString = hashRow(data);
    data.profileHash = hashString;
    try {
      const queryBuilderResult = await AppDataSource.getRepository(Celebrity)
        .createQueryBuilder("celebrity")
        .update(data)
        .where('celebrity."userId" = :userId', { userId })
        .returning('id, alias, thumbnail, "imagePlaceholder", "imageThumbnail", image, description, "profileHash"')
        .execute();
      const celeb = queryBuilderResult.raw[0];

      upsertCelebritySearchItem(celeb);

      return { success: "updated succesfully!" };
    } catch (err) {
      return { errorMessage: "An Error Occured" };
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async setVideoCallTimeSlots(
    @Arg("schedule", () => [CallScheduleInput]) schedule: CallScheduleInput[],
    @Ctx() { req }: AppContext
  ) {
    const userId = req.session.userId;
    const celeb = await Celebrity.findOne({ where: { userId }, select: ["id"] });
    if (celeb && schedule.length > 0) {
      const callScheduleTreerepo = AppDataSource.getTreeRepository(CallScheduleBase);
      const scheduleExists = await callScheduleTreerepo.findOne({ where: { celebId: celeb.id, parent: false } });
      if (scheduleExists) return false;
      const result = await scheduleCallSlot(celeb.id, schedule);
      return result;
    } else return false;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async updateVideoCallTimeSlots(
    @Arg("schedule", () => [CallScheduleInput]) schedule: CallScheduleInput[],
    @Ctx() { req }: AppContext
  ) {
    const userId = req.session.userId;
    const celeb = await Celebrity.findOne({ where: { userId }, select: ["id"] });
    if (celeb && schedule.length > 0) {
      const result = await updateCallSlot(celeb.id, schedule);
      return result;
    } else return false;
  }

  @Query(() => CallScheduleBase, { nullable: true })
  @UseMiddleware(isAuthenticated)
  async getAvailableTimeSlots(@Arg("celebId", () => Int) celebId: number) {
    const callScheduleTreerepo = AppDataSource.getTreeRepository(CallScheduleBase);
    const parent = await callScheduleTreerepo.findOne({ where: { celebId, parent: false } });
    if (parent) {
      const result = await callScheduleTreerepo.findDescendantsTree(parent);
      result.children.forEach((x) => {
        x.children.forEach((y) => {
          y.children = y.children.filter((z) => {
            if (z.available === true) {
              return true;
            }
            return false;
          });
        });
      });

      return result;
    }
    return {};
  }

  @Query(() => [Celebrity], { nullable: true })
  @CacheControl({ maxAge: 300, scope: CacheScope.Public })
  async celebrities(
    @Arg("celebId", () => Int, { nullable: true }) celebId: number,
    @Arg("limit", () => Int, { nullable: true }) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ) {
    if (celebId) {
      const celeb = await Celebrity.findOne({ where: { id: celebId } });
      if (!celeb) {
        return [];
      }
      return [celeb];
    }
    const maxLimit = Math.min(18, limit);

    const queryBuilder = AppDataSource.getRepository(Celebrity)
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
    let celebs = await queryBuilder.getMany();

    celebs = attachInstantShoutoutPrice(celebs);

    // const data = celebs.map((obj) => ({
    //   ...obj,
    //   celebrity: obj.celebrity?.profileObject,
    // }));
    return celebs;
  }

  @Query(() => [Celebrity])
  @CacheControl({ maxAge: 3600, scope: CacheScope.Public })
  async similarToCelebrity(@Arg("celebId") celebId: number, @Arg("limit", () => Int) limit: number) {
    const maxLimit = Math.min(8, limit);
    try {
      const catIds = [];
      const categoryObj = await AppDataSource.getRepository(CelebCategories)
        .createQueryBuilder("celebCat")
        .select("celebCat.categoryId")
        .where("celebCat.celebId = :celebId", { celebId })
        .getMany();

      for (const item of categoryObj) {
        catIds.push(item.categoryId);
      }
      const celebs = await AppDataSource.query(
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
