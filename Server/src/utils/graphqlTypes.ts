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
export class CreateCelebrityInputs {
  @Field()
  alias: string;
  @Field()
  acceptsVideoRequests: boolean;
  @Field()
  acceptsCallRequets: boolean;
  @Field()
  videoRequestRatesInNaira: string;
  @Field()
  callRequestRatesInNaira: string;
  userId: string | undefined;
}

@InputType()
export class UserInputsLogin {
  @Field()
  password: string;
  @Field()
  email: string;
}

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
