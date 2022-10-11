import crypto from "crypto";
import dayjs from "dayjs";
import { readFileSync } from "fs";
import { join } from "path";
import {
  CelebrityApplicationInputs,
  GenericResponse,
  ImageUpload,
  ImageUploadInput,
  ImageUploadLinks,
  ImageUploadMetadata,
  ImageUploadResponse,
  OnboardCelebrityInputs,
  UpdateCelebrityInputs,
} from "../utils/graphqlTypes";
import CacheControl from "../cache/cacheControl";
import { Brackets } from "typeorm";
import { Signer } from "../utils/cloudFront";
import { Arg, Ctx, Int, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Celebrity } from "../entities/Celebrity";
import { User } from "../entities/User";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { AppContext } from "../types";
import { hashRow } from "../utils/hashRow";
import { CelebCategories } from "../entities/CelebCategories";
import { upsertCelebritySearchItem } from "../services/search/addSearchItem";
import { CacheScope } from "apollo-server-types";
import { AppDataSource } from "../db";
import { attachInstantShoutoutPrice } from "../utils/helpers";
import { CelebrityApplications } from "../entities/CelebrityApplications";
import { CELEB_PREREGISTRATION_PREFIX } from "../constants";
import { generateCallTimeSlots } from "../scheduler/videoCallScheduler";

@Resolver()
export class CelebrityResolver {
  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuthenticated)
  async celebApplication(
    @Arg("input") input: CelebrityApplicationInputs,
    @Ctx() { req, redis }: AppContext
  ): Promise<GenericResponse> {
    const userId = req.session.userId;
    if (!input.facebook && !input.instagram && !input.twitter && !input.phoneNumber) {
      return { errorMessage: "You must provide at least one (1) medium to verify your claim" };
    }
    const exists = await redis.get(CELEB_PREREGISTRATION_PREFIX + userId);
    if (exists) {
      return {
        errorMessage: "Seems like you applied recently, try again a week from when you made your initial application",
      };
    }
    try {
      const user = await User.findOne({ where: { userId }, select: ["email", "userId"] });
      if (!user) throw new Error();
      await CelebrityApplications.create({
        email: user.email,
        userId: user.userId,
        alias: input.alias,
        facebook: input.facebook,
        instagram: input.instagram,
        twitter: input.twitter,
        phoneNumber: input.phoneNumber,
      }).save();
      await redis.set(CELEB_PREREGISTRATION_PREFIX + userId, userId as string, "EX", 3600 * 24 * 7);
      return { success: "Great!🔥 You'll get an email from us soon regarding the next steps to take" };
    } catch (err) {
      return { errorMessage: "Request Failed. An error occured" };
    }
  }

  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuthenticated)
  async onBoardCeleb(@Ctx() { req }: AppContext, @Arg("data") data: OnboardCelebrityInputs): Promise<GenericResponse> {
    const userId = req.session.userId as string;
    data.isNew = false;
    if (data.acceptsCallTypeA === false && data.acceptsCallTypeB === false && data.acceptsShoutout === false) {
      return { errorMessage: "You have to accept at least one type of request" };
    }
    if (data.acceptsShoutout === false && data.acceptsInstantShoutout === true) throw new Error("");

    if (data.callScheduleSlots && data.callScheduleSlots.length > 0) {
      data.availableTimeSlots = generateCallTimeSlots(data.callScheduleSlots);
    }
    delete data.callScheduleSlots;

    const hashString = hashRow(data);
    data.profileHash = hashString;
    try {
      await AppDataSource.getRepository(Celebrity)
        .createQueryBuilder("celebrity")
        .update(data)
        .where('celebrity."userId" = :userId', { userId })
        .returning("*")
        .execute();

      return { success: `You're set! Time to make someone's dream come through ⭐️` };
    } catch (err) {
      console.log(err);
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

    if (data.acceptsShoutout === false && data.acceptsInstantShoutout === true) {
      return { errorMessage: "An error occured" };
    }

    if (data.callScheduleSlots && data.callScheduleSlots.length > 0) {
      data.availableTimeSlots = generateCallTimeSlots(data.callScheduleSlots);
      delete data.callScheduleSlots;
    }

    const hashString = hashRow(data);
    data.profileHash = hashString;
    try {
      const queryBuilderResult = await AppDataSource.getRepository(Celebrity)
        .createQueryBuilder("celebrity")
        .update(data)
        .where('celebrity."userId" = :userId', { userId })
        .returning('id, alias, thumbnail, placeholder, "lowResPlaceholder", image, description, "profileHash"')
        .execute();
      const celeb: Celebrity = queryBuilderResult.raw[0];

      if (celeb.thumbnail && celeb.placeholder && celeb.lowResPlaceholder && celeb.image) {
        await upsertCelebritySearchItem(celeb);
      }

      return { success: "updated succesfully!" };
    } catch (err) {
      return { errorMessage: "An Error Occured" };
    }
  }

  // @Mutation(() => Boolean)
  // @UseMiddleware(isAuthenticated)
  // async updateVideoCallTimeSlots(
  //   @Arg("schedule", () => [CallScheduleInput]) schedule: CallScheduleInput[],
  //   @Ctx() { req }: AppContext
  // ) {
  //   const userId = req.session.userId;
  //   const celeb = await Celebrity.findOne({ where: { userId }, select: ["id"] });
  //   if (celeb && schedule.length > 0) {
  //     const result = await updateCallSlot(celeb.id, schedule);
  //     return result;
  //   } else return false;
  // }

  @Query(() => [Celebrity], { nullable: true })
  @CacheControl({ maxAge: 300, scope: CacheScope.Public })
  async celebrities(
    @Arg("celebId", () => Int, { nullable: true }) celebId: number,
    @Arg("limit", () => Int, { nullable: true }) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<Celebrity[]> {
    if (celebId) {
      const celeb = await Celebrity.findOne({ where: { id: celebId } });
      if (!celeb) {
        return [];
      }
      const celebArray = attachInstantShoutoutPrice([celeb]);
      return celebArray;
    }
    const maxLimit = Math.min(18, limit);

    const queryBuilder = AppDataSource.getRepository(Celebrity)
      .createQueryBuilder("celeb")
      .where("celeb.Id is not null")
      .andWhere(
        new Brackets((qb) => {
          qb.andWhere("celeb.thumbnail is not null")
            .andWhere("celeb.image is not null")
            .andWhere("celeb.placeholder is not null")
            .andWhere("celeb.lowResPlaceholder is not null");
        })
      )
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

  @Query(() => ImageUploadResponse)
  @UseMiddleware(isAuthenticated)
  getImageUploadUrl(@Arg("input") input: ImageUploadInput, @Ctx() { req }: AppContext): ImageUploadResponse {
    if (!input.image && !input.thumbnail) return { errorMessage: "file url type not selected" };
    const userId = req.session.userId as string;
    const cdnUrl = process.env.AWS_CLOUD_FRONT_IMAGE_SOURCE_DOMAIN;
    const keyPairId = process.env.AWS_CLOUD_FRONT_IMAGE_SOURCE_KEY_PAIR_ID;
    const pathToKey = join(__dirname, "../../keys/private_key.pem");
    const key = readFileSync(pathToKey, "utf8");

    const cdnSigner = new Signer(keyPairId, key);

    const duration = 1000 * 30; // 30 secs
    const inputVals = Object.keys(input);
    inputVals.forEach((x) => {
      if (!input[x as keyof typeof input]) {
        delete input[x as keyof typeof input];
      }
    });

    const inputValsSanitized = Object.keys(input);

    const randomNumber = Math.random().toString();
    const datetime = dayjs().format("DD-MM-YYYY");
    const hash = crypto
      .createHash("md5")
      .update(datetime + randomNumber)
      .digest("hex");
    const links: ImageUploadLinks[] = inputValsSanitized.map((x) => {
      const type = x === "image" ? "image" : "thumbnail";
      const id = `${userId}/${type}/${datetime}-${hash}`;
      const signedUrl = cdnSigner.getSignedUrl({
        url: `${cdnUrl}/${id}`,
        expires: Math.floor((Date.now() + duration) / 1000),
      });
      return { type, id, signedUrl };
    });

    const metadata: ImageUploadMetadata = { userId };

    links.forEach((x) => {
      if (x.type === "image") metadata.image = x.id;
      if (x.type === "thumbnail") metadata.thumbnail = x.id;
    });

    const jsonFileName = `${datetime}-${hash}.json`;
    const signedUrl = cdnSigner.getSignedUrl({
      url: `${cdnUrl}/${jsonFileName}`,
      expires: Math.floor((Date.now() + duration) / 1000),
    });

    const imageData: ImageUpload = { urls: links, metadataUrl: signedUrl, metadata };

    return { data: imageData };
  }
}
