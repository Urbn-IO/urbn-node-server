import { User } from "../entities/User";
import { InputType, Field, ObjectType } from "type-graphql";
import { Categories } from "../entities/Categories";
import { CardAuthorization } from "../entities/CardAuthorization";

@InputType()
export class UserInputs {
  @Field()
  firstName: string;
  @Field()
  lastName: string;
  @Field()
  nationality: string;
  @Field()
  email!: string;
  @Field()
  password!: string;
}

@InputType()
export class RegisterCelebrityInputs {
  @Field()
  alias: string;
  @Field()
  acceptShoutOut: boolean;
  @Field()
  acceptsCalls: boolean;
  @Field()
  shoutOutRatesInNaira: string;
  @Field()
  thumbnail: string;
  @Field()
  _3minsCallRequestRatesInNaira: string;
  @Field()
  _5minsCallRequestRatesInNaira: string;
  @Field()
  description: string;
  @Field()
  image: string;
  imageThumbnail: string;
  imagePlaceholder: string;
  profileHash: string;
  userId: string | undefined;
}
@InputType()
export class UpdateCelebrityInputs {
  @Field({ nullable: true })
  alias: string;
  @Field({ nullable: true })
  acceptShoutOut: boolean;
  @Field({ nullable: true })
  acceptsCalls: boolean;
  @Field({ nullable: true })
  shoutOutRatesInNaira: string;
  @Field({ nullable: true })
  thumbnail: string;
  @Field({ nullable: true })
  _3minsCallRequestRatesInNaira: string;
  @Field({ nullable: true })
  _5minsCallRequestRatesInNaira: string;
  @Field({ nullable: true })
  description: string;
  @Field({ nullable: true })
  image: string;
  imageThumbnail: string;
  imagePlaceholder: string;
  profileHash: string;
  userId: string | undefined;
}

@InputType()
export class UserInputsLogin {
  @Field()
  password: string;
  @Field()
  email: string;
}

// @InputType()
// export class CategoryIds {
//   @Field(() => [Int])
//   categoryId: number[];
// }

//remove the field propery in future
@ObjectType()
export class FieldWithError {
  @Field()
  field: string;

  @Field()
  errorMessage: string;
}

@ObjectType()
export class UserResponse {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => [FieldWithError], { nullable: true })
  errors?: FieldWithError[];
}

@ObjectType()
export class CategoryResponse {
  @Field(() => Categories, { nullable: true })
  category?: Categories;

  @Field(() => [FieldWithError], { nullable: true })
  errors?: FieldWithError[];
}

@ObjectType()
export class CardResponse {
  @Field(() => [CardAuthorization], { nullable: true })
  cards?: CardAuthorization[];

  @Field(() => [FieldWithError], { nullable: true })
  errors?: FieldWithError[];
}
@ObjectType()
export class genericResponse {
  @Field(() => String, { nullable: true })
  success?: string;

  @Field(() => [FieldWithError], { nullable: true })
  errors?: FieldWithError[];
}

@ObjectType()
export class callTokenResponse {
  @Field(() => String, { nullable: true })
  token?: string;

  @Field(() => String, { nullable: true })
  roomName?: string;

  @Field(() => [FieldWithError], { nullable: true })
  errors?: FieldWithError[];
}
