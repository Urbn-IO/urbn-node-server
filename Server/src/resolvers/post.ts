// import { Post } from "../entities/post";
// import { AppContext } from "../types";
// import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

// @Resolver()
// export class PostResolver {
//   @Query(() => [Post])
//   posts(@Ctx() { em }: AppContext): Promise<Post[]> {
//     return em.find(Post, {});
//   }

//   @Query(() => Post, { nullable: true })
//   post(@Arg("id") id: number, @Ctx() { em }: AppContext): Promise<Post | null> {
//     return em.findOne(Post, { id });
//   }

//   @Mutation(() => Post)
//   async createPost(
//     @Arg("name") name: string,
//     @Ctx() { em }: AppContext
//   ): Promise<Post> {
//     const post = em.create(Post, { name });
//     await em.persistAndFlush(post);
//     return post;
//   }

//   @Mutation(() => Post, { nullable: true })
//   async updatePost(
//     @Arg("id") id: number,
//     @Arg("name") name: string,
//     @Ctx() { em }: AppContext
//   ): Promise<Post | null> {
//     const post = await em.findOne(Post, { id });
//     if (!post) {
//       return null;
//     }
//     if (typeof name !== undefined) {
//       post.name = name;
//       await em.persistAndFlush(post);
//     }

//     return post;
//   }

//   @Mutation(() => Boolean)
//   async deletePost(
//     @Arg("id") id: number,
//     @Ctx() { em }: AppContext
//   ): Promise<boolean> {
//     try {
//       await em.nativeDelete(Post, { id });
//     } catch {
//       return false;
//     }
//     return true;
//   }
// }
