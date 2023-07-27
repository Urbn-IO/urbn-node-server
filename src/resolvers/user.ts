import argon2 from 'argon2';
import { isEmail, length } from 'class-validator';
import AppDataSource from 'config/ormconfig';
import { APP_BASE_URL, APP_SESSION_PREFIX, CONFIRM_EMAIL_PREFIX, RESET_PASSWORD_PREFIX } from 'constant';
import { Celebrity } from 'entities/Celebrity';
import { CelebrityApplications } from 'entities/CelebrityApplications';
import { Role } from 'entities/Role';
import { User } from 'entities/User';
import { getUserOAuth } from 'services/auth/oauth';
import sendMail from 'services/aws/email/manager';
import { createDynamicLink } from 'services/deep_links/dynamicLinks';
import tokensManager from 'services/notifications/tokensManager';
import { deleteCelebritySearchItem } from 'services/typesense/search/functions';
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { AppContext, EmailSubject, SignInMethod } from 'types';
import { DeviceInfoInput, GenericResponse, UserInputs, UserInputsLogin, UserResponse } from 'utils/graphqlTypes';
import { destroySession } from 'utils/helpers';
import { v4 } from 'uuid';

@Resolver()
export class UserResolver {
  baseUrl = APP_BASE_URL;
  //create User resolver
  @Mutation(() => UserResponse)
  async createUser(
    @Arg('token') token: string,
    @Arg('userInput') userInput: UserInputs,
    @Arg('deviceInfo') device: DeviceInfoInput,
    @Ctx() { req, redis }: AppContext
  ): Promise<UserResponse> {
    const key = CONFIRM_EMAIL_PREFIX + token;
    const email = await redis.get(key);
    if (!email) return { errorMessage: 'Link expired' };
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
        devicePlatform: device.platform,
      }).save();

      await Role.create({ user }).save();
      await tokensManager().addNotificationToken(user.userId, device);
      req.session.userId = id; //keep a new user logged in
      return { user };
    } catch (err) {
      if (err.code === '23505') {
        return {
          errorMessage: 'Email already exists, go to login page!',
        };
      } else {
        return { errorMessage: 'An error occured' };
      }
    }
  }

  //Login resolver
  @Mutation(() => UserResponse)
  async loginUser(
    @Arg('userInput') userInput: UserInputsLogin,
    @Arg('deviceInfo') device: DeviceInfoInput,
    @Ctx() { req, redis }: AppContext
  ): Promise<UserResponse> {
    const session = APP_SESSION_PREFIX + req.session.id;
    const key = await redis.exists(session);
    const email = userInput.email;
    if (key !== 0) return { errorMessage: "You're already logged in" };
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.shoutouts', 'shoutouts')
      .leftJoinAndSelect('user.celebrity', 'celebrity')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) return { errorMessage: 'Wrong Email or Password' };
    if (!user.password)
      return {
        errorMessage: 'Wrong login method, login using another method',
      };
    const verifiedPassword = await argon2.verify(user.password, userInput.password);
    if (!verifiedPassword) return { errorMessage: 'Wrong Email or Password' };
    await redis.del(user.sessionKey); // delete any other session on other devices
    await User.update(user.id, {
      sessionKey: session,
      devicePlatform: device.platform,
    });
    await tokensManager().addNotificationToken(user.userId, device);
    const token = v4();
    const link = `${this.baseUrl}/reset-password/${token}`;
    const url = await createDynamicLink(link);
    if (!url) return { errorMessage: 'An unexpected error occured' };
    await redis.set(RESET_PASSWORD_PREFIX + token, user.email, 'EX', 3600 * 24); //link expires in one day
    if (user.isEmailActive) {
      await sendMail({
        emailAddresses: [user.email],
        name: user.displayName,
        url,
        subject: EmailSubject.SECURITY_ALERT,
        sourcePlatform: device.platform,
      });
    }

    req.session.userId = user.userId; //log user in
    return { user };
  }

  @Mutation(() => UserResponse)
  async loginWithOAuth(
    @Arg('uid') uid: string,
    @Arg('deviceInfo') device: DeviceInfoInput,
    @Ctx() { req, redis }: AppContext
  ): Promise<UserResponse> {
    const session = APP_SESSION_PREFIX + req.session.id;
    const key = await redis.exists(session);
    if (key !== 0) return { errorMessage: "You're already logged in" };
    const auth = await getUserOAuth(uid);
    if (auth === null) return { errorMessage: "Couldn't authenticate your account" };
    let user = await User.findOne({
      where: {
        email: auth.email?.toLowerCase(),
      },
      relations: ['shoutouts', 'celebrity'],
    });
    if (user) {
      await redis.del(user.sessionKey);
      await User.update(user.id, {
        sessionKey: session,
        devicePlatform: device.platform,
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
      devicePlatform: device.platform,
    }).save();

    await Role.create({ user }).save();

    await tokensManager().addNotificationToken(user.userId, device);
    req.session.userId = id;
    return { user };
  }

  @Mutation(() => GenericResponse)
  async confirmEmail(
    @Arg('email') email: string,
    @Arg('existingUser', { defaultValue: false }) existingUser: boolean,
    @Ctx() { redis }: AppContext
  ): Promise<GenericResponse> {
    email = email.toLowerCase();
    const valid = isEmail(email);
    if (!valid)
      return {
        errorMessage: 'Invalid email address format, you might have a typo',
      };
    const route = existingUser ? 'update-email' : 'create-account';
    const token = v4();
    const link = `${this.baseUrl}/${route}/${token}`;
    const url = await createDynamicLink(link);
    if (!url) return { errorMessage: 'An unexpected error occured' };
    await redis.set(CONFIRM_EMAIL_PREFIX + token, email, 'EX', 3600 * 24); //link expires in one day
    await sendMail({ emailAddresses: [email], url, subject: EmailSubject.CONFIRM_EMAIL });

    return {
      success: `Check the inbox of ${email}, we've sent you an email on the next steps to take`,
    };
  }

  @Mutation(() => GenericResponse)
  @Authorized()
  async updateEmail(@Arg('token') token: string, @Ctx() { req, redis }: AppContext): Promise<GenericResponse> {
    const userId = req.session.userId;
    const key = CONFIRM_EMAIL_PREFIX + token;
    const email = await redis.get(key);
    if (!email) return { errorMessage: 'Link expired' };
    try {
      const user = await User.findOne({
        where: { userId },
        select: ['id', 'userId', 'authMethod'],
      });
      if (!user || user.authMethod === SignInMethod.OAUTH || user.userId !== userId) {
        await redis.del(key);
        return { errorMessage: 'An error occured' };
      }
      await User.update(user.id, { email });
      await redis.del(key);
      return { success: 'Email succesfully updated' };
    } catch (err) {
      console.error(err);
      return { errorMessage: 'An error occured' };
    }
  }

  @Mutation(() => GenericResponse)
  async forgotPassword(@Arg('email') email: string, @Ctx() { redis }: AppContext): Promise<GenericResponse> {
    email = email.toLowerCase();
    const valid = isEmail(email);
    if (!valid)
      return {
        errorMessage: 'Invalid email address format, you might have a typo',
      };
    const user = await User.findOne({ where: { email: email } });
    if (!user || user.authMethod === SignInMethod.OAUTH) return { errorMessage: 'This email isn’t registered yet' };
    const token = v4();
    const name = user.displayName;
    const link = `${this.baseUrl}/reset-password/${token}`;
    const url = await createDynamicLink(link);
    if (!url) return { errorMessage: 'An unexpected error occured' };
    await redis.set(RESET_PASSWORD_PREFIX + token, email, 'EX', 3600); //link expires in one hour
    await sendMail({
      emailAddresses: [email],
      name,
      url,
      subject: EmailSubject.RESET_PASSWORD,
    });

    return {
      success: `Check the inbox of ${email}. We've sent you an email on the next steps to take`,
    };
  }

  //change password from reset password (forgot password)
  @Mutation(() => GenericResponse)
  async resetPassword(
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: AppContext,
    @Arg('token', { nullable: true }) token?: string
  ): Promise<GenericResponse> {
    const min = 8;
    const max = 16;
    const validationMessage = length(newPassword, min, max);
    if (!validationMessage) {
      return {
        errorMessage: `Password should be between ${min} and ${max} characters inclusive in length`,
      };
    }

    if (!token) {
      const userId = req.session.userId;
      if (!userId) return { errorMessage: 'You must be logged in' };
      const user = await User.findOne({
        where: { userId },
        select: ['id', 'password', 'authMethod', 'isTempPassword'],
      });
      if (!user || user.authMethod === SignInMethod.OAUTH) return { errorMessage: 'An error occured' };
      if (user.isTempPassword) {
        const isOldPassword = await argon2.verify(user.password, newPassword);
        if (isOldPassword) {
          return {
            errorMessage: 'You cannot reuse your old password',
          };
        }
        const hashedPassword = await argon2.hash(newPassword);
        await User.update(user.id, { password: hashedPassword, isTempPassword: false });
        return { success: 'Password succesfully updated' };
      }
      return { errorMessage: 'You must use the forgot password link' };
    }

    const key = RESET_PASSWORD_PREFIX + token;
    const email = await redis.get(key);
    if (!email) return { errorMessage: 'Link expired' };

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'authMethod', 'password'],
    });

    if (!user || user.authMethod === SignInMethod.OAUTH) {
      await redis.del(key);
      return { errorMessage: 'An error occured' };
    }
    const isOldPassword = await argon2.verify(user.password, newPassword);
    if (isOldPassword)
      return {
        errorMessage: 'You cannot reuse your old password, you must provide a new password',
      };
    try {
      await User.update(
        { id: user.id },
        {
          password: await argon2.hash(newPassword),
        }
      );
      await redis.del(key);
      return { success: 'successfully changed password' };
    } catch (err) {
      console.error(err);
      return { errorMessage: 'An error occured' };
    }
  }

  //resolver for an already logged in user to change (update) their password
  @Mutation(() => GenericResponse)
  @Authorized()
  async updatePassword(
    @Arg('oldPassword') oldPassword: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { req }: AppContext
  ): Promise<GenericResponse> {
    const userId = req.session.userId;
    const min = 8;
    const max = 16;
    const validation = length(newPassword, min, max);
    if (!validation) {
      return {
        errorMessage: `Password should be between ${min} and ${max} characters inclusive in length`,
      };
    }
    const user = await User.findOne({
      where: { userId },
      select: ['id', 'userId', 'authMethod', 'password'],
    });
    if (!user || user.authMethod === SignInMethod.OAUTH || user.userId !== userId) {
      return { errorMessage: 'An error occured' };
    }
    const isOldPassword = await argon2.verify(user.password, oldPassword);
    if (!isOldPassword) return { errorMessage: 'Your current password is not wrong! try again' };
    try {
      await User.update(user.id, {
        password: await argon2.hash(newPassword),
        isTempPassword: false, //for users with a randomly generated old password (temp password). Set to false after first password change
      });
      return { success: 'successfully changed password' };
    } catch (err) {
      console.error(err);
      return { errorMessage: 'An error occured' };
    }
  }

  //logout user
  @Mutation(() => Boolean)
  @Authorized()
  async logout(@Ctx() { req, res }: AppContext): Promise<unknown> {
    const userId = req.session.userId;
    if (userId) {
      await tokensManager().removeNotificationTokens(userId);
    }
    return await destroySession(req, res);
  }

  @Mutation(() => GenericResponse)
  @Authorized()
  async destroyAccount(@Ctx() { req, res }: AppContext): Promise<GenericResponse> {
    try {
      const userId = req.session.userId;
      const user = await AppDataSource.getRepository(User)
        .createQueryBuilder('user')
        .where('user.userId = :userId', { userId })
        .leftJoinAndSelect('user.celebrity', 'celebrity')
        .getOne();
      if (!user) return { errorMessage: 'User not found' };
      const deleted = await User.remove(user);
      if (deleted) {
        if (user.celebrity) {
          await Celebrity.remove(user.celebrity);
          await deleteCelebritySearchItem(user.celebrity.id);
        }
        await CelebrityApplications.delete({ userId });
        await tokensManager().removeNotificationTokens(userId);
        await destroySession(req, res);
      }
      return { success: 'Your account has been successfully deleted' };
    } catch (err) {
      console.error(err);
      return { errorMessage: 'An error occured while attempting to delete your account, try again later' };
    }
  }

  //validate user by password
  @Query(() => Boolean)
  @Authorized()
  async validateUser(@Arg('password') password: string, @Ctx() { req }: AppContext) {
    const userId = req.session.userId;
    const user = await User.findOne({
      where: { userId },
      select: ['password'],
    });
    if (!user) return false;
    if (!user.password) return false;
    const verifiedPassword = await argon2.verify(user.password, password);
    return verifiedPassword;
  }

  //fetch current logged in user
  @Query(() => UserResponse, { nullable: true })
  @Authorized()
  async loggedInUser(@Ctx() { req }: AppContext): Promise<UserResponse> {
    const userId = req.session.userId;
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.shoutouts', 'shoutouts')
      .leftJoinAndSelect('user.celebrity', 'celebrity')
      .where('user.userId = :userId', { userId })
      .getOne();

    if (!user) {
      return { errorMessage: 'User not found' };
    }

    return { user };
  }
}
