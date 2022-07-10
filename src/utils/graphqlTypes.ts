import { User } from "../entities/User";
import { InputType, Field, ObjectType, Int, registerEnumType } from "type-graphql";
import { Categories } from "../entities/Categories";
import { CardAuthorization } from "../entities/CardAuthorization";
import { CallType, ContentType, DayOfTheWeek } from "../types";

registerEnumType(CallType, {
  name: "CallType",
  description: "Type of video call to be made",
});

registerEnumType(DayOfTheWeek, {
  name: "DayOfTheWeek",
  description: "Enum representing each day of the week",
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
  _3minsCallRequestRatesInNaira: string;
  @Field()
  _5minsCallRequestRatesInNaira: string;
  @Field()
  description: string;
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
export class ShoutoutRequestInput {
  @Field(() => Int)
  celebId: number;
  @Field()
  description: string;
  @Field()
  requestExpiration: Date;
}
@InputType()
export class VideoCallRequestInputs {
  @Field(() => Int)
  celebId: number;

  @Field(() => Int)
  selectedTimeSlotId: number;

  @Field(() => CallType)
  callType: CallType;
}

@InputType()
export class CallScheduleInput {
  @Field(() => DayOfTheWeek)
  day: DayOfTheWeek;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;
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
export class InitializeCardResponse {
  @Field(() => String, { nullable: true })
  authUrl?: string;

  @Field(() => String, { nullable: true })
  ref?: string;

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

  requestor?: string;

  @Field({ nullable: true })
  errorMessage?: string;
}

@ObjectType()
class CustomVideoMetadata {
  @Field()
  userId: string;

  @Field()
  contentType: ContentType;

  @Field({ nullable: true })
  owner?: string;

  @Field({ nullable: true })
  alias?: string;

  @Field(() => Int, { nullable: true })
  requestId?: number;
}

@ObjectType()
class VideoMetadata {
  @Field(() => String)
  srcVideo: string;

  @Field(() => CustomVideoMetadata)
  customMetadata: CustomVideoMetadata;
}
@ObjectType()
export class VideoData {
  @Field(() => String)
  videoUrl: string;
  @Field(() => String)
  metadataUrl: string;
  @Field(() => VideoMetadata)
  metadata: VideoMetadata;
}

@ObjectType()
export class VideoUploadData {
  @Field(() => VideoData, { nullable: true })
  videoData?: VideoData;
  @Field({ nullable: true })
  errorMessage?: string;
}

@ObjectType()
export class S3SignedObject {
  @Field()
  signedUrl: string;

  @Field({ nullable: true })
  fileName?: string;
}

@ObjectType()
export class Person {
  @Field()
  name: string;

  @Field(() => Int)
  age: number;

  @Field()
  gender: string;
}
@InputType()
export class PersonInput {
  @Field()
  name: string;

  @Field(() => Int)
  age: number;

  @Field()
  gender: string;
}

@ObjectType()
export class SubPayload {
  @Field()
  newPerson: Person;
  @Field()
  userId: string;
}
