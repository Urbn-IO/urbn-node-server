import tokensManager from "../services/notifications/tokensManager";
import { User } from "../entities/User";
import { AppContext, EmailSubject, SignInMethod } from "../types";
import argon2 from "argon2";
import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { deviceInfo, GenericResponse, UserInputs, UserInputsLogin, UserResponse } from "../utils/graphqlTypes";
import { v4 } from "uuid";
import { APP_SESSION_PREFIX, CONFIRM_EMAIL_PREFIX, SESSION_COOKIE_NAME, RESET_PASSWORD_PREFIX } from "../constants";
import { isAuthenticated } from "../middleware/isAuthenticated";
import sendMail from "../services/mail/manager";
import { createDeepLink } from "../services/deep_links/dynamicLinks";
import { isEmail, length } from "class-validator";
import { getUserOAuth } from "../services/auth/oauth";
import { AppDataSource } from "../db";

@Resolver()
export class UserResolver {
  baseUrl = process.env.APP_BASE_URL;
  //create User resolver
  @Mutation(() => UserResponse)
  async createUser(
    @Arg("token") token: string,
    @Arg("userInput") userInput: UserInputs,
    @Arg("deviceInfo") device: deviceInfo,
    @Ctx() { req, redis }: AppContext
  ): Promise<UserResponse> {
    const key = CONFIRM_EMAIL_PREFIX + token;
    const email = await redis.get(key);
    if (!email) return { errorMessage: "Link expired" };
    const hashedPassword = await argon2.hash(userInput.password);
    const id = v4();
    await redis.del(key);
    try {
      const user = await User.create({
        displayName: userInput.displayName,
        email,
        password: hashedPassword,
        userId: id,
        sessionKey: APP_SESSION_PREFIX + req.session.id,
      }).save();
      await tokensManager().addNotificationToken(user.userId, device);
      req.session.userId = id; //keep a new user logged in
      return { user };
    } catch (err) {
      if (err.code === "23505") {
        return { errorMessage: "Email already exists, go to login page!" };
      } else {
        return { errorMessage: "An error occured" };
      }
    }
  }

  //Login resolver
  @Mutation(() => UserResponse)
  async loginUser(
    @Arg("userInput") userInput: UserInputsLogin,
    @Arg("deviceInfo") device: deviceInfo,
    @Ctx() { req, redis }: AppContext
  ): Promise<UserResponse> {
    const session = APP_SESSION_PREFIX + req.session.id;
    const key = await redis.exists(session);
    if (key === 0) {
      const user = await User.findOne({
        where: {
          email: userInput.email.toLowerCase(),
        },
        relations: ["shoutouts", "celebrity", "cards"],
      });
      if (!user) return { errorMessage: "Wrong Email or Password" };
      if (!user.password) return { errorMessage: "Wrong login method, login using another method" };
      const verifiedPassword = await argon2.verify(user.password, userInput.password);
      if (!verifiedPassword) return { errorMessage: "Wrong Email or Password" };
      await redis.del(user.sessionKey);
      await User.update(user.id, {
        sessionKey: session,
      });
      await tokensManager().addNotificationToken(user.userId, device);
      const token = v4();
      const link = `${this.baseUrl}/reset-password/${token}`;
      const url = await createDeepLink(link);
      if (!url) return { errorMessage: "An unexpected error occured" };
      await redis.set(RESET_PASSWORD_PREFIX + token, user.email, "EX", 3600 * 24); //link expires in one day
      await sendMail({
        email: [user.email],
        name: user.displayName,
        url,
        subject: EmailSubject.SECURITY,
        sourcePlatform: device.platform,
      });
      req.session.userId = user.userId; //log user in
      return { user };
    }
    return { errorMessage: "You're already logged in" };
  }

  @Mutation(() => UserResponse)
  async loginWithOAuth(
    @Arg("uid") uid: string,
    @Arg("deviceInfo") device: deviceInfo,
    @Ctx() { req, redis }: AppContext
  ): Promise<UserResponse> {
    const session = APP_SESSION_PREFIX + req.session.id;
    const key = await redis.exists(session);
    if (key === 0) {
      const auth = await getUserOAuth(uid);
      console.log("auth is: ", auth);
      if (auth === null) return { errorMessage: "Couldn't authenticate your account" };
      let user = await User.findOne({
        where: {
          email: auth.email?.toLowerCase(),
        },
        relations: ["shoutouts", "celebrity", "cards"],
      });
      if (user) {
        await redis.del(user.sessionKey);
        await User.update(user.id, {
          sessionKey: session,
        });
        await tokensManager().addNotificationToken(user.userId, device);
        req.session.userId = user.userId;
        return { user };
      }
      const id = v4();
      user = await User.create({
        displayName: auth.displayName,
        email: auth.email,
        userId: id,
        sessionKey: session,
        authMethod: SignInMethod.OAUTH,
      }).save();
      await tokensManager().addNotificationToken(user.userId, device);
      req.session.userId = id;
      return { user };
    }
    return { errorMessage: "You're already logged in" };
  }

  @Mutation(() => GenericResponse)
  async confirmEmail(
    @Arg("email") email: string,
    @Arg("existingUser", { defaultValue: false }) existingUser: boolean,
    @Ctx() { redis }: AppContext
  ): Promise<GenericResponse> {
    const valid = isEmail(email);
    if (!valid) return { errorMessage: "Invalid email address format, you might have a typo" };
    let route = "create-account";
    if (existingUser) route = "update-email";
    email = email.toLowerCase();
    const token = v4();
    const link = `${this.baseUrl}/${route}/${token}`;
    const url = await createDeepLink(link);
    if (!url) return { errorMessage: "An unexpected error occured" };
    await redis.set(CONFIRM_EMAIL_PREFIX + token, email, "EX", 3600 * 24); //link expires in one day
    await sendMail({ email: [email], url, subject: EmailSubject.CONFIRM });

    return {
      success: `Check the inbox of ${email}, we've sent you an email on the next steps to take`,
    };
  }

  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuthenticated)
  async updateEmail(@Arg("token") token: string, @Ctx() { req, redis }: AppContext): Promise<GenericResponse> {
    const userId = req.session.userId;
    const key = CONFIRM_EMAIL_PREFIX + token;
    const email = await redis.get(key);
    if (!email) return { errorMessage: "Link expired" };
    try {
      const user = await User.findOne({ where: { userId }, select: ["id", "userId", "authMethod"] });
      if (!user || user.authMethod === SignInMethod.OAUTH || user.userId !== userId) {
        await redis.del(key);
        return { errorMessage: "An error occured" };
      }
      await User.update(user.id, { email });
      await redis.del(key);
      return { success: "Email succesfully updated" };
    } catch (err) {
      console.log(err);
      return { errorMessage: "An error occured" };
    }
  }

  @Mutation(() => GenericResponse)
  async resetPassword(@Arg("email") email: string, @Ctx() { redis }: AppContext): Promise<GenericResponse> {
    email = email.toLowerCase();
    const valid = isEmail(email);
    if (!valid) return { errorMessage: "Invalid email address format, you might have a typo" };
    const user = await User.findOne({ where: { email: email } });
    if (!user || user.authMethod === SignInMethod.OAUTH) return { errorMessage: "This email isn’t registered yet" };
    const token = v4();
    const name = user.displayName;
    const link = `${this.baseUrl}/reset-password/${token}`;
    const url = await createDeepLink(link);
    if (!url) return { errorMessage: "An unexpected error occured" };
    await redis.set(RESET_PASSWORD_PREFIX + token, email, "EX", 3600); //link expires in one hour
    await sendMail({ email: [email], name, url, subject: EmailSubject.RESET });

    return { success: `Check the inbox of ${email}. We've sent you an email on the next steps to take` };
  }

  //change password from reset password (forgot password)
  @Mutation(() => GenericResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis }: AppContext
  ): Promise<GenericResponse> {
    const min = 8;
    const max = 16;
    const validationMessage = length(newPassword, min, max);
    if (!validationMessage) {
      return { errorMessage: `Password should be between ${min} and ${max} characters inclusive in length` };
    }
    const key = RESET_PASSWORD_PREFIX + token;
    const email = await redis.get(key);
    if (!email) return { errorMessage: "Link expired" };

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      select: ["id", "authMethod", "password"],
    });

    if (!user || user.authMethod === SignInMethod.OAUTH) {
      await redis.del(key);
      return { errorMessage: "An error occured" };
    }
    const isOldPassword = await argon2.verify(user.password, newPassword);
    if (isOldPassword) return { errorMessage: "You cannot reuse your old password, you must provide a new password" };
    try {
      await User.update(
        { id: user.id },
        {
          password: await argon2.hash(newPassword),
        }
      );
      await redis.del(key);
      return { success: "successfully changed password" };
    } catch (err) {
      console.log(err);
      return { errorMessage: "An error occured" };
    }
  }

  //resolver for an already logged in user to change (update) their password
  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuthenticated)
  async updatePassword(
    @Arg("oldPassword") oldPassword: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    const userId = req.session.userId;
    const min = 8;
    const max = 16;
    const validation = length(newPassword, min, max);
    if (!validation) {
      return { errorMessage: `Password should be between ${min} and ${max} characters inclusive in length` };
    }
    const user = await User.findOne({ where: { userId }, select: ["id", "userId", "authMethod", "password"] });
    if (!user || user.authMethod === SignInMethod.OAUTH || user.userId !== userId) {
      return { errorMessage: "An error occured" };
    }
    const isOldPassword = await argon2.verify(user.password, oldPassword);
    if (!isOldPassword) return { errorMessage: 'Incorrect "Old password" ' };
    try {
      await User.update(user.id, { password: await argon2.hash(newPassword) });
      return { success: "successfully changed password" };
    } catch (err) {
      console.log(err);
      return { errorMessage: "An error occured" };
    }
  }

  //logout user
  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async logout(@Ctx() { req, res }: AppContext): Promise<unknown> {
    const userId = req.session.userId;
    if (userId) {
      await tokensManager().removeNotificationTokens(userId);
    }
    return new Promise((resolve, reject) =>
      req.session.destroy((err: unknown) => {
        res.clearCookie(SESSION_COOKIE_NAME);
        if (err) {
          console.log(err);
          reject(err);
          return;
        }

        resolve(true);
      })
    );
  }

  //validate user by password
  @Query(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async validateUser(@Arg("password") password: string, @Ctx() { req }: AppContext) {
    const userId = req.session.userId;
    const user = await User.findOne({ where: { userId }, select: ["password"] });
    if (!user) return false;
    if (!user.password) return false;
    const verifiedPassword = await argon2.verify(user.password, password);
    return verifiedPassword;
  }

  //fetch current logged in user
  @Query(() => UserResponse, { nullable: true })
  @UseMiddleware(isAuthenticated)
  async loggedInUser(@Ctx() { req }: AppContext): Promise<UserResponse> {
    const userId = req.session.userId;
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.shoutouts", "shoutouts")
      .leftJoinAndSelect("user.celebrity", "celebrity")
      .leftJoinAndSelect("user.cards", "cards")
      .where("user.userId = :userId", { userId })
      .getOne();

    if (!user) {
      return { errorMessage: "User not found" };
    }

    return { user };
  }
}
