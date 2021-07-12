import { User } from "../entities/User";
import { Mycontext } from "../types";
import argon2 from "argon2";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { UserCategories } from "../entities/UserCategories";
import {
  UserInputs,
  UserInputsLogin,
  UserResponse,
} from "../utils/graphqlTypes";
@Resolver()
export class UserResolver {
  //create User resolver
  @Mutation(() => UserResponse, { nullable: true })
  async createUser(
    @Arg("userInput") userInput: UserInputs,
    @Ctx() { em, req }: Mycontext
  ): Promise<UserResponse> {
    const email = userInput.email.toLowerCase();
    const regexp = new RegExp(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
    const validEmail = regexp.test(email);

    if (!validEmail) {
      return {
        errors: [{ field: "email", errorMessage: "Invalid email format" }],
      };
    }

    if (userInput.password.length < 8) {
      return {
        errors: [
          {
            field: "password",
            errorMessage: "Password must be at least 8 characters long!",
          },
        ],
      };
    }
    const hashedPassword = await argon2.hash(userInput.password);
    const user = em.create(User, {
      firstName: userInput.firstName,
      lastName: userInput.lastName,
      nickName: userInput.nickName,
      celebrity: userInput.celebrity,
      email: email,
      password: hashedPassword,
    });
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "email",
              errorMessage: "Email already exists, go to login page!",
            },
          ],
        };
      }
    }
    req.session.userId = user.email; //keep a new user logged in
    return { user };
  }

  //Login resolver
  @Mutation(() => UserResponse, { nullable: true })
  async loginUser(
    @Arg("userInput") userInput: UserInputsLogin,
    @Ctx() { em, req }: Mycontext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, {
      email: userInput.email.toLowerCase(),
    });
    if (!user) {
      return {
        errors: [{ field: "email", errorMessage: "Wrong Email or Password" }],
      };
    }
    const verifiedPassword = await argon2.verify(
      user.password,
      userInput.password
    );
    if (!verifiedPassword) {
      return {
        errors: [
          { field: "password", errorMessage: "Wrong Email or Password" },
        ],
      };
    }
    req.session.userId = user.email;
    return { user };
  }

  @Mutation(() => UserResponse, { nullable: true })
  async updateUserDetails(
    @Arg("email") email: string,
    @Arg("nickName") nickName: string,
    @Ctx() { em }: Mycontext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { email });
    if (!user) {
      return {
        errors: [
          {
            field: "email",
            errorMessage: "User not found",
          },
        ],
      };
    }
    if (nickName === null || nickName === undefined) {
      return {
        errors: [
          {
            field: "nickName",
            errorMessage: "nick name not supplied",
          },
        ],
      };
    }
    user.nickName = nickName;
    await em.persistAndFlush(user);

    return { user };
  }
  //delete user
  @Mutation(() => Boolean)
  async deleteUser(
    @Arg("id") id: number,
    @Ctx() { em }: Mycontext
  ): Promise<boolean> {
    try {
      await em.nativeDelete(User, { id });
      await em.nativeDelete(UserCategories, { userId: id });
    } catch {
      return false;
    }
    return true;
  }

  //fetch current logged in user
  @Query(() => User, { nullable: true })
  async loggedInUser(@Ctx() { req, em }: Mycontext): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }
    return await em.findOne(User, { email: req.session.userId });
  }
}
