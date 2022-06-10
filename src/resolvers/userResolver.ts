import tokensManager from "../utils/tokensManager";
import { User } from "../entities/User";
import { AppContext } from "../types";
import argon2 from "argon2";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import {
  GenericResponse,
  UserInputs,
  UserInputsLogin,
  UserResponse,
} from "../utils/graphqlTypes";
import { v4 } from "uuid";
import { sendEmail } from "../utils/sendMail";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { isAuth } from "../middleware/isAuth";
import { validateInput } from "../utils/validateInput";
import { Celebrity } from "../entities/Celebrity";
import { In } from "typeorm";
@Resolver()
export class UserResolver {
  //create User resolver
  @Mutation(() => GenericResponse)
  async createUser(
    @Arg("userInput") userInput: UserInputs,
    @Arg("notificationToken") token: string,
    @Arg("deviceId") deviceId: string,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    const invalidInput = validateInput(userInput);
    if (invalidInput) {
      return invalidInput;
    }
    const email = userInput.email.toLowerCase();
    const hashedPassword = await argon2.hash(userInput.password);
    const id = v4();
    try {
      await User.create({
        firstName: userInput.firstName,
        lastName: userInput.lastName,
        email,
        password: hashedPassword,
        userId: id,
      }).save();
    } catch (err) {
      if (err.code === "23505") {
        return { errorMessage: "Email already exists, go to login page!" };
      } else {
        return { errorMessage: "An error occured" };
      }
    }
    tokensManager().addNotificationToken(id, deviceId, token);
    req.session.userId = id; //keep a new user logged in
    return { success: "Account created successfully" };
  }

  //Login resolver
  @Mutation(() => UserResponse)
  async loginUser(
    @Arg("userInput") userInput: UserInputsLogin,
    @Arg("notificationToken") token: string,
    @Arg("deviceId") deviceId: string,
    @Ctx() { req }: AppContext
  ): Promise<UserResponse> {
    const user = await User.findOne({
      where: {
        email: userInput.email.toLowerCase(),
      },
      relations: ["celebrity"],
    });
    if (!user) {
      return { errorMessage: "Wrong Email or Password" };
    }
    const verifiedPassword = await argon2.verify(
      user.password,
      userInput.password
    );
    if (!verifiedPassword) {
      return { errorMessage: "Wrong Email or Password" };
    }
    tokensManager().addNotificationToken(user.userId, deviceId, token);
    req.session.userId = user.userId;
    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: AppContext
  ): Promise<boolean> {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      //user doesn't exist
      return false;
    }
    const token = v4();
    redis.set(FORGET_PASSWORD_PREFIX + token, email, "ex", 1000 * 60 * 60 * 24); //one day to use forget password token
    await sendEmail(email, `Hello there it works ${token}`);

    return true;
  }

  //change password
  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: AppContext
  ): Promise<UserResponse> {
    if (newPassword.length < 8) {
      return { errorMessage: "Password must contain at least 8 characters" };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userEmail = await redis.get(key);
    if (!userEmail) {
      return { errorMessage: "token expired" };
    }

    const user = await User.findOne({
      where: { email: userEmail.toLowerCase() },
    });

    if (!user) {
      return { errorMessage: "user no longer exists" };
    }

    await User.update(
      { id: user.id },
      {
        password: await argon2.hash(newPassword),
      }
    );

    await redis.del(key);

    // log in user after change password
    req.session.userId = user.userId;

    return { user };
  }
  //logout user
  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: AppContext): Promise<unknown> {
    const userId = req.session.userId;
    if (userId) {
      await tokensManager().removeNotificationTokens(userId);
    }
    return new Promise((resolve) =>
      req.session.destroy((err: any) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }

  //delete user
  // @Mutation(() => Boolean)
  // async deleteUser(@Arg("id") id: number): Promise<boolean> {
  //   const user = await User.findOne({ id });
  //   try {
  //     await User.delete({ id: user?.id });
  //   } catch {
  //     return false;
  //   }
  //   return true;
  // }

  //QUERIES
  //fetch current logged in user
  @Query(() => UserResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async loggedInUser(@Ctx() { req }: AppContext): Promise<UserResponse> {
    if (!req.session.userId) {
      return { errorMessage: "No session Id" };
    }
    const user = await User.findOne({
      where: { userId: req.session.userId },
      relations: ["shoutouts", "celebrity"],
    });
    if (!user) {
      return { errorMessage: "User not found" };
    }
    if (user.shoutouts.length > 0) {
      const ids = [];
      for (const shoutout of user.shoutouts) {
        ids.push(shoutout.celebId);
      }
      const alias = await Celebrity.find({
        select: ["alias", "userId"],
        where: { userId: In(ids) },
      });
      alias.forEach((x) => {
        for (const shoutout of user.shoutouts) {
          if (x.userId === shoutout.celebId) {
            shoutout.celebAlias = x.alias as string;
          }
        }
      });
    }

    return { user };
  }

  //fetch all users, with optional parameter to fetch a single user by userId

  // @Query(() => [User], { nullable: true })
  // @UseMiddleware(isAuth)
  // async users(@Arg("userId", { nullable: true }) userId: string) {
  //   if (userId) {
  //     const user = await User.find({
  //       where: { userId },
  //     });
  //     return user;
  //   }
  //   return await User.find();
  // }
}
