import { User } from "../entities/User";
import { InputType, Field, ObjectType } from "type-graphql";

@InputType()
export class UserInputs {
  @Field()
  firstName: string;
  @Field()
  lastName: string;
  @Field({ nullable: true })
  nickName?: string;
  @Field()
  celebrity: boolean;
  @Field()
  email!: string;
  @Field()
  password!: string;
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
