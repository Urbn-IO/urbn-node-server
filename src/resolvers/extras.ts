import CacheControl from 'cache/cacheControl';
import { Featured } from 'entities/Featured';
import { Report } from 'entities/Report';
import { Requests } from 'entities/Requests';
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { AppContext } from 'types';
import { GenericResponse, ReportInput } from 'utils/graphqlTypes';

@Resolver()
export class ExtrasResolver {
  @Query(() => [Featured])
  //cache for 1 week
  @CacheControl({ maxAge: 604800 })
  async getFeatured(): Promise<Featured[]> {
    return await Featured.find();
  }

  @Mutation(() => GenericResponse)
  @Authorized()
  async report(@Ctx() { req }: AppContext, @Arg('input') input: ReportInput): Promise<GenericResponse> {
    const reporter = req.session.userId as string;
    try {
      const request = await Requests.findOne({ where: { reference: input.ref } });
      if (request === null) return { errorMessage: ' Reported request was not found! Unable to create a case' };
      const isCeleb = request.celebrity === reporter;
      await Report.save({
        reporter,
        offender: input.offender,
        description: input.description,
        request,
        reporterIsCeleb: isCeleb,
      });
      return { success: 'Hold on while we investigate this issue' };
    } catch (err) {
      console.error(err);
      return { errorMessage: 'We are unable to file your report right now, please try again in a moment' };
    }
  }
}
