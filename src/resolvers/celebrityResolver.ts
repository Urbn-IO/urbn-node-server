import {
  CallScheduleInput,
  GenericResponse,
  RegisterCelebrityInputs,
  UpdateCelebrityInputs,
} from "../utils/graphqlTypes";
import { Arg, Ctx, Int, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Celebrity } from "../entities/Celebrity";
import { User } from "../entities/User";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { AppContext } from "../types";
import { getConnection } from "typeorm";
import { hashRow } from "../utils/hashRow";
import { CelebCategories } from "../entities/CelebCategories";
import { upsertCelebritySearchItem } from "../services/search/addSearchItem";
import { scheduleCallSlot, updateCallSlot } from "../scheduler/videoCallScheduler";
import { CallScheduleBase } from "../entities/CallScheduleBase";

@Resolver()
export class CelebrityResolver {
  cdnUrl = process.env.AWS_CLOUD_FRONT_PUBLIC_DISTRIBUTION_DOMAIN;
  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuthenticated)
  async registerUserAsCeleb(
    @Ctx() { req }: AppContext,
    @Arg("data") data: RegisterCelebrityInputs
  ): Promise<GenericResponse> {
    const userId = req.session.userId as string;
    data.userId = userId;
    const maxRate = 50000000;

    if (
      parseInt(data._3minsCallRequestRatesInNaira) > maxRate ||
      parseInt(data._5minsCallRequestRatesInNaira) > maxRate ||
      parseInt(data.shoutOutRatesInNaira) > maxRate
    ) {
      return { errorMessage: "Maximum price rate for any request exceeded" };
    }

    if (data.acceptsCallTypeA === false && data.acceptsCallTypeB === false && data.acceptShoutOut === false) {
      return { errorMessage: "You have to accept at least one type of request" };
    }

    const hashString = hashRow(data);
    data.profileHash = hashString;

    try {
      const celeb = Celebrity.create(data);
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
    const maxRate = 50000000;

    if (Object.keys(data).length === 0) {
      return { errorMessage: "Nothing to update" };
    }

    if (
      parseInt(data._3minsCallRequestRatesInNaira) > maxRate ||
      parseInt(data._5minsCallRequestRatesInNaira) > maxRate ||
      parseInt(data.shoutOutRatesInNaira) > maxRate
    ) {
      return { errorMessage: "Maximum price rate for any request exceeded" };
    }

    if (data.acceptsCallTypeA === false && data.acceptsCallTypeB === false && data.acceptShoutOut === false) {
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
      await Celebrity.update({ userId }, data);
      const user = await getConnection()
        .getRepository(User)
        .createQueryBuilder("user")
        .where("user.userId = :userId", { userId })
        .leftJoinAndSelect("user.celebrity", "celebrity")
        .getOne();

      upsertCelebritySearchItem(user);

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
      const callScheduleTreerepo = getConnection().getTreeRepository(CallScheduleBase);
      const scheduleExists = await callScheduleTreerepo.findOne({ where: { celebId: celeb.id, parent: null } });
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
    const callScheduleTreerepo = getConnection().getTreeRepository(CallScheduleBase);
    const parent = await callScheduleTreerepo.findOne({ where: { celebId, parent: null } });
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
    return null;
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
  async similarToCelebrity(@Arg("celebId") celebId: number, @Arg("limit", () => Int) limit: number) {
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
