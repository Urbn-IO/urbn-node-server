import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql';
import { Brackets } from 'typeorm';
import CacheControl from '../cache/cacheControl';
import { CELEB_PREREGISTRATION_PREFIX } from '../constants';
import { AppDataSource } from '../db';
import { CelebCategories } from '../entities/CelebCategories';
import { Celebrity } from '../entities/Celebrity';
import { CelebrityApplications } from '../entities/CelebrityApplications';
import { Role } from '../entities/Role';
import { User } from '../entities/User';
import { getSignedImageMetadata, getSignedVideoMetadata } from '../lib/cloudfront/uploadSigner';
import { generateCallTimeSlots } from '../scheduler/videoCallScheduler';
import { upsertCelebritySearchItem } from '../services/search/addSearchItem';
import { AppContext, ContentType, Roles } from '../types';
import {
  CelebrityApplicationInputs,
  GenericResponse,
  ImageUploadResponse,
  OnboardCelebrityInputs,
  UpdateCelebrityInputs,
  VideoUploadResponse,
} from '../utils/graphqlTypes';
import { hashRow } from '../utils/hashRow';
import { attachInstantShoutoutPrice } from '../utils/helpers';

@Resolver()
export class CelebrityResolver {
  @Mutation(() => GenericResponse)
  // @Authorized()
  async celebApplication(
    @Arg('input') input: CelebrityApplicationInputs,
    @Ctx() { req, redis }: AppContext
  ): Promise<GenericResponse> {
    const userId = req.session.userId;
    if (!input.facebook && !input.instagram && !input.twitter && !input.phoneNumber) {
      return {
        errorMessage: 'You must provide at least one (1) medium to verify your claim',
      };
    }
    const exists = await redis.get(CELEB_PREREGISTRATION_PREFIX + userId);
    if (exists) {
      return {
        errorMessage: 'Seems like you applied recently, try again a week from when you made your initial application',
      };
    }
    try {
      const user = await User.findOne({
        where: { userId },
        select: ['email', 'userId'],
      });
      if (!user) throw new Error();
      await CelebrityApplications.create({
        email: user.email,
        userId: user.userId,
        alias: input.alias.trim(),
        facebook: input.facebook?.trim(),
        instagram: input.instagram?.trim(),
        twitter: input.twitter?.trim(),
        phoneNumber: input.phoneNumber?.trim(),
      }).save();
      await redis.set(CELEB_PREREGISTRATION_PREFIX + userId, userId as string, 'EX', 3600 * 24 * 7);
      return {
        success: "Great!🔥 You'll get an email from us soon regarding the next steps to take",
      };
    } catch (err) {
      return { errorMessage: 'Request Failed. An error occured' };
    }
  }

  @Mutation(() => GenericResponse)
  @Authorized()
  async onBoardCeleb(@Ctx() { req }: AppContext, @Arg('data') data: OnboardCelebrityInputs): Promise<GenericResponse> {
    const userId = req.session.userId as string;
    data.isNew = false;
    if (data.acceptsCallTypeA === false && data.acceptsCallTypeB === false && data.acceptsShoutout === false) {
      return {
        errorMessage: 'You have to accept at least one type of request',
      };
    }
    if (data.acceptsShoutout === false && data.acceptsInstantShoutout === true) {
      throw new Error('Invalid request ');
    }

    if (data.callScheduleSlots && data.callScheduleSlots.length > 0) {
      data.availableTimeSlots = generateCallTimeSlots(data.callScheduleSlots);
    }
    delete data.callScheduleSlots;

    const hashString = hashRow(data);
    data.profileHash = hashString;
    try {
      await AppDataSource.getRepository(Celebrity)
        .createQueryBuilder('celebrity')
        .update(data)
        .where('celebrity."userId" = :userId', { userId })
        .returning('*')
        .execute();

      const user = await User.findOne({ where: { userId } });
      if (user) {
        await Role.create({ user, role: Roles.CELEBRITY }).save();
      }

      return {
        success: `You're set! Time to make someone's dreams come through ⭐️`,
      };
    } catch (err) {
      console.log(err);
      return { errorMessage: 'An Error Occured' };
    }
  }

  //update celeb details
  @Mutation(() => GenericResponse, { nullable: true })
  @Authorized(Roles.CELEBRITY)
  async updateCelebDetails(
    @Arg('data') data: UpdateCelebrityInputs,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    const userId = req.session.userId as string;
    if (Object.keys(data).length === 0) {
      return { errorMessage: 'Nothing to update' };
    }

    if (data.acceptsCallTypeA === false && data.acceptsCallTypeB === false && data.acceptsShoutout === false) {
      return {
        errorMessage: 'You have to accept at least one type of request',
      };
    }

    if (data.acceptsShoutout === false && data.acceptsInstantShoutout === true) {
      return { errorMessage: 'An error occured' };
    }

    if (data.callScheduleSlots && data.callScheduleSlots.length > 0) {
      data.availableTimeSlots = generateCallTimeSlots(data.callScheduleSlots);
      delete data.callScheduleSlots;
    }

    const hashString = hashRow(data);
    data.profileHash = hashString;
    try {
      const queryBuilderResult = await AppDataSource.getRepository(Celebrity)
        .createQueryBuilder('celebrity')
        .update(data)
        .where('celebrity."userId" = :userId', { userId })
        .returning('id, alias, thumbnail, placeholder, "lowResPlaceholder", "videoBanner", description, "profileHash"')
        .execute();
      const celeb: Celebrity = queryBuilderResult.raw[0];

      if (celeb.thumbnail && celeb.placeholder && celeb.lowResPlaceholder && celeb.videoBanner) {
        await upsertCelebritySearchItem(celeb);
      }

      return { success: 'updated succesfully!' };
    } catch (err) {
      return { errorMessage: 'An Error Occured' };
    }
  }

  @Query(() => [Celebrity], { nullable: true })
  @CacheControl({ maxAge: 300 })
  async celebrities(
    @Arg('celebId', () => Int, { nullable: true }) celebId: number,
    @Arg('limit', () => Int, { nullable: true }) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null
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
      .createQueryBuilder('celeb')
      .where('celeb.Id is not null')
      .andWhere(
        new Brackets((qb) => {
          qb.andWhere('celeb.thumbnail is not null')
            .andWhere('celeb.videoBanner is not null')
            .andWhere('celeb.placeholder is not null')
            .andWhere('celeb.lowResPlaceholder is not null');
        })
      )
      .orderBy('celeb.updatedAt', 'DESC')
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
  @CacheControl({ maxAge: 3600 })
  async similarToCelebrity(@Arg('celebId') celebId: number, @Arg('limit', () => Int) limit: number) {
    const maxLimit = Math.min(8, limit);
    try {
      const catIds = [];
      const categoryObj = await AppDataSource.getRepository(CelebCategories)
        .createQueryBuilder('celebCat')
        .select('celebCat.categoryId')
        .where('celebCat.celebId = :celebId', { celebId })
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
  @Authorized(Roles.CELEBRITY)
  getImageUploadMetadata(@Ctx() { req }: AppContext): ImageUploadResponse {
    const userId = req.session.userId as string;
    const data = getSignedImageMetadata(userId);
    return data;
  }

  @Query(() => VideoUploadResponse)
  @Authorized(Roles.CELEBRITY)
  getVideoBannerUploadMetadata(@Ctx() { req }: AppContext): VideoUploadResponse {
    const userId = req.session.userId as string;
    const data = getSignedVideoMetadata({
      destBucket: process.env.AWS_STATIC_VIDEO_BUCKET,
      cloudFront: process.env.AWS_VOD_STATIC_DISTRIBUTION_DOMAIN,
      jobTemplate: process.env.AWS_VOD_STACK_NAME + process.env.AWS_VOD_CUSTOM_JOB_TEMPLATE,
      customMetadata: {
        userId,
        contentType: ContentType.BANNER,
      },
    });
    return data;
  }
}
