import { User } from "../entities/User";
import { InputType, Field, ObjectType, registerEnumType } from "type-graphql";
import { Categories } from "../entities/Categories";
import { CardAuthorization } from "../entities/CardAuthorization";
import { contentType, requestType } from "../types";

registerEnumType(requestType, {
  name: "requestType",
  description: "Type of request to be made",
});

@InputType()
export class UserInputs {
  @Field()
  firstName: string;
  @Field()
  lastName: string;
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
  acceptsCallTypeA: boolean;
  @Field()
  acceptsCallTypeB: boolean;
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
  acceptsCallTypeA: boolean;
  @Field({ nullable: true })
  acceptsCallTypeB: boolean;
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

@InputType()
export class RequestInputs {
  @Field()
  celebId: string;
  @Field(() => requestType)
  requestType: requestType;
  @Field({ nullable: true })
  description: string;
  @Field()
  requestExpiration: Date;
}

// @InputType()
// export class CategoryIds {
//   @Field(() => [Int])
//   categoryId: number[];
// }

//remove the field propery in future

@ObjectType()
export class UserResponse {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field({ nullable: true })
  errorMessage?: string;
}

@ObjectType()
export class CategoryResponse {
  @Field(() => Categories, { nullable: true })
  category?: Categories;

  @Field({ nullable: true })
  errorMessage?: string;
}

@ObjectType()
export class CardResponse {
  @Field(() => [CardAuthorization], { nullable: true })
  cards?: CardAuthorization[];

  @Field({ nullable: true })
  errorMessage?: string;
}
@ObjectType()
export class GenericResponse {
  @Field(() => String, { nullable: true })
  success?: string;

  @Field({ nullable: true })
  errorMessage?: string;
}

@ObjectType()
export class CallTokenResponse {
  @Field(() => String, { nullable: true })
  token?: string;

  @Field(() => String, { nullable: true })
  roomName?: string;

  @Field({ nullable: true })
  errorMessage?: string;
}

@ObjectType()
export class videoUploadData {
  @Field(() => videoData, { nullable: true })
  videoData?: videoData;
  @Field({ nullable: true })
  errorMessage?: string;
}

@ObjectType()
export class videoData {
  @Field(() => String)
  videoUrl: string;
  @Field(() => String)
  metadataUrl: string;
  @Field(() => videoMetadata)
  metadata: videoMetadata;
}

@ObjectType()
class videoMetadata {
  @Field(() => String)
  srcVideo: string;

  @Field(() => customVideoMetadata)
  customMetadata: customVideoMetadata;
}
@ObjectType()
class customVideoMetadata {
  @Field()
  userId: string;

  @Field()
  contentType: contentType;

  @Field({ nullable: true })
  owner?: string;

  @Field({ nullable: true })
  alias?: string;

  @Field({ nullable: true })
  requestId?: number;
}

@ObjectType()
export class s3SignedObject {
  @Field()
  signedUrl: string;

  @Field({ nullable: true })
  fileName?: string;
}
