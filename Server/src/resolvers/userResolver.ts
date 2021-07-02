import { User } from "../entities/User";
import { Mycontext } from "src/types";
import argon2 from "argon2";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Resolver,
} from "type-graphql";

@InputType()
class UserInputs {
  @Field()
  firstName: string;
  @Field()
  lastName: string;
  @Field({ nullable: true })
  nickName?: string;
  @Field()
  password: string;
  @Field()
  email: string;
}

@InputType()
class UserInputsLogin {
  @Field()
  password: string;
  @Field()
  email: string;
}
//remove the field propery in future
@ObjectType()
class FieldWithError {
  @Field()
  field: string;

  @Field()
  errorMessage: string;
}

@ObjectType()
class UserResponse {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => [FieldWithError], { nullable: true })
  errors?: FieldWithError[];
}

@Resolver()
export class UserResolver {
  //create User resolver
  @Mutation(() => UserResponse, { nullable: true })
  async createUser(
    @Arg("userInput") userInput: UserInputs,
    @Ctx() { em }: Mycontext
  ): Promise<UserResponse | null> {
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

    return { user };
  }

  //Login resolver
  @Mutation(() => UserResponse, { nullable: true })
  async loginUser(
    @Arg("userInput") userInput: UserInputsLogin,
    @Ctx() { em }: Mycontext
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

    return { user };
  }
}
