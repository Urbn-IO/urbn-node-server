import tokensManager from "../services/notifications/tokensManager";
import { User } from "../entities/User";
import { AppContext, EmailSubject } from "../types";
import argon2 from "argon2";
import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { deviceInfo, GenericResponse, UserInputs, UserInputsLogin, UserResponse } from "../utils/graphqlTypes";
import { v4 } from "uuid";
import { APP_SESSION_PREFIX, CONFIRM_EMAIL_PREFIX, COOKIE_NAME, RESET_PASSWORD_PREFIX } from "../constants";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { validateEmail, validatePassword } from "../utils/validateInput";
import { sendMail } from "../services/mail/manager";
@Resolver()
export class UserResolver {
  //create User resolver
  @Mutation(() => GenericResponse)
  async createUser(
    @Arg("token") token: string,
    @Arg("userInput") userInput: UserInputs,
    @Arg("deviceInfo") device: deviceInfo,
    @Ctx() { req, redis }: AppContext
  ): Promise<GenericResponse> {
    const validationMessage = validatePassword(userInput);
    if (validationMessage.errorMessage !== undefined) return validationMessage;
    const key = CONFIRM_EMAIL_PREFIX + token;
    const email = await redis.get(key);
    if (!email) return { errorMessage: "This link has expired" };
    const date = new Date();
    const age = date.getFullYear() - userInput.dateOfBirth.getFullYear();
    if (isNaN(age)) return { errorMessage: "Invalid date of birth" };
    if (age < 13) return { errorMessage: "You're a little too young for Urbn, ask your parents to create an account" };
    if (age > 130) return { errorMessage: "Are you immortal?" };
    const hashedPassword = await argon2.hash(userInput.password);
    const id = v4();
    await redis.del(key);
    try {
      await User.create({
        firstName: userInput.firstName,
        lastName: userInput.lastName,
        email,
        password: hashedPassword,
        userId: id,
        sessionKey: APP_SESSION_PREFIX + req.session.id,
      }).save();
    } catch (err) {
      if (err.code === "23505") {
        return { errorMessage: "Email already exists, go to login page!" };
      } else {
        return { errorMessage: "An error occured" };
      }
    }
    tokensManager().addNotificationToken(id, device.id, device.platform, device.notificationToken, device.pushkitToken);
    req.session.userId = id; //keep a new user logged in
    return { success: "Account created successfully" };
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
        relations: ["celebrity", "cards"],
      });
      if (!user) {
        return { errorMessage: "Wrong Email or Password" };
      }
      const verifiedPassword = await argon2.verify(user.password, userInput.password);
      if (!verifiedPassword) return { errorMessage: "Wrong Email or Password" };
      await redis.del(user.sessionKey);
      await User.update(user.id, {
        sessionKey: session,
      });
      await tokensManager().addNotificationToken(
        user.userId,
        device.id,
        device.platform,
        device.notificationToken,
        device.pushkitToken
      );
      req.session.userId = user.userId; //log user in
      const token = v4();
      const url = `${process.env.APP_BASE_URL}/reset-password/${token}`;
      await redis.set(RESET_PASSWORD_PREFIX + token, user.email, "EX", 3600 * 24); //link expires in one day
      await sendMail({
        email: [user.email],
        name: user.firstName,
        url,
        subject: EmailSubject.SECURITY,
        sourcePlatform: device.platform,
      });
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
    const valid = validateEmail(email);
    if (!valid) return { errorMessage: "Invalid email address format, you might have a typo" };
    let route;
    if (existingUser) route = "update-email";
    else route = "create-account";
    email = email.toLowerCase();
    const token = v4();
    const url = `${process.env.APP_BASE_URL}/${route}/${token}`;
    await redis.set(CONFIRM_EMAIL_PREFIX + token, email, "EX", 3600 * 24); //link expires in one day
    await sendMail({ email: [email], url, subject: EmailSubject.CONFIRM });

    return {
      success: `Verify your email. Check the inbox of ${email}, we've sent you an email on the next steps to take`,
    };
  }

  @Mutation(() => GenericResponse)
  @UseMiddleware(isAuthenticated)
  async updateEmail(@Arg("token") token: string, @Ctx() { req, redis }: AppContext): Promise<GenericResponse> {
    const userId = req.session.userId;
    const key = CONFIRM_EMAIL_PREFIX + token;
    const email = await redis.get(key);
    if (!email) return { errorMessage: "This link has expired" };
    try {
      const user = await User.findOne({ where: { userId }, select: ["id", "userId"] });
      if (!user) return { errorMessage: "An error occured" };
      if (user.userId !== userId) return { errorMessage: "Unauthorized Action" };
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
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return { errorMessage: "This email isn’t registered yet" };
    }
    const token = v4();
    const name = user.firstName;
    const url = `${process.env.APP_BASE_URL}/reset-password/${token}`;
    await redis.set(RESET_PASSWORD_PREFIX + token, email, "EX", 3600); //link expires in one hour
    await sendMail({ email: [email], name, url, subject: EmailSubject.RESET });

    return { success: `Check the inbox of ${email}. We've sent you an email on the next steps to take` };
  }

  //change password
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: AppContext
  ): Promise<UserResponse> {
    if (newPassword.length < 8) {
      return { errorMessage: "Password must contain at least 8 characters" };
    }

    const key = RESET_PASSWORD_PREFIX + token;
    const email = await redis.get(key);
    if (!email) {
      return { errorMessage: "This link has expired" };
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return { errorMessage: "user no longer exists" };
    }

    const isOldPassword = await argon2.verify(user.password, newPassword);
    if (isOldPassword) {
      return { errorMessage: "You cannot reuse your old password, you must provide a new password" };
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
  @UseMiddleware(isAuthenticated)
  async logout(@Ctx() { req, res }: AppContext): Promise<unknown> {
    const userId = req.session.userId;
    if (userId) {
      await tokensManager().removeNotificationTokens(userId);
    }
    return new Promise((resolve, reject) =>
      req.session.destroy((err: unknown) => {
        res.clearCookie(COOKIE_NAME);
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
    const verifiedPassword = await argon2.verify(user.password, password);
    return verifiedPassword;
  }

  //fetch current logged in user
  @Query(() => UserResponse, { nullable: true })
  @UseMiddleware(isAuthenticated)
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
    // if (user.shoutouts.length > 0) {
    //   const ids = [];
    //   for (const shoutout of user.shoutouts) {
    //     ids.push(shoutout.celebId);
    //   }
    //   const alias = await Celebrity.find({
    //     select: ["alias", "userId"],
    //     where: { userId: In(ids) },
    //   });
    //   alias.forEach((x) => {
    //     for (const shoutout of user.shoutouts) {
    //       if (x.userId === shoutout.celebId) {
    //         shoutout.celebAlias = x.alias as string;
    //       }
    //     }
    //   });
    // }

    return { user };
  }
}
