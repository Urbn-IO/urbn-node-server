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
  UserInputs,
  UserInputsLogin,
  UserResponse,
} from "../utils/graphqlTypes";
import { v4 } from "uuid";
import { sendEmail } from "../utils/sendMail";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { isAuth } from "../middleware/isAuth";
@Resolver()
export class UserResolver {
  //create User resolver
  @Mutation(() => UserResponse, { nullable: true })
  async createUser(
    @Arg("userInput") userInput: UserInputs,
    @Ctx() { req }: AppContext
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
    const id = v4();
    let user;
    try {
      const createUser = User.create({
        firstName: userInput.firstName,
        lastName: userInput.lastName,
        nickName: userInput.nickName,
        celebrity: userInput.celebrity,
        email,
        password: hashedPassword,
        userId: id,
      });
      user = createUser;
      await user.save();
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
    req.session.userId = user?.userId; //keep a new user logged in
    return { user };
  }

  //Login resolver
  @Mutation(() => UserResponse, { nullable: true })
  async loginUser(
    @Arg("userInput") userInput: UserInputsLogin,
    @Ctx() { req }: AppContext
  ): Promise<UserResponse> {
    const user = await User.findOne({
      where: {
        email: userInput.email.toLowerCase(),
      },
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
      return true;
    }
    const token = v4();
    redis.set(FORGET_PASSWORD_PREFIX + token, email, "ex", 1000 * 60 * 60 * 24); //one day to use forget password token
    await sendEmail(email, `Hello there it works ${token}`);

    return true;
  }

  //change password
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: AppContext
  ): Promise<UserResponse> {
    if (newPassword.length < 8) {
      return {
        errors: [
          {
            field: "newPassword",
            errorMessage: "Password must contain at least 8 characters ",
          },
        ],
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userEmail = await redis.get(key);
    if (!userEmail) {
      return {
        errors: [
          {
            field: "token",
            errorMessage: "token expired",
          },
        ],
      };
    }

    const user = await User.findOne({
      where: { email: userEmail.toLowerCase() },
    });

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            errorMessage: "user no longer exists",
          },
        ],
      };
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

  //update user details
  @Mutation(() => UserResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async updateUserDetails(
    @Arg("email") email: string,
    @Arg("nickName") nickName: string
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
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
    await User.update({ id: user.id }, { nickName: user.nickName });

    return { user };
  }
  //logout user
  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: AppContext): Promise<unknown> {
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

  //fetch current logged in user
  @Query(() => UserResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async loggedInUser(@Ctx() { req }: AppContext): Promise<UserResponse> {
    if (!req.session.userId) {
      return {
        errors: [{ field: "", errorMessage: "No session Id" }],
      };
    }
    const user = await User.findOne({ where: { userId: req.session.userId } });
    if (!user) {
      return {
        errors: [
          {
            field: "",
            errorMessage: "User not found",
          },
        ],
      };
    }
    return { user };
  }
}
