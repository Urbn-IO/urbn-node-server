import { IsDate, IsEmail, Length, Max, Min, IsPhoneNumber } from "class-validator";
import { User } from "../entities/User";
import { InputType, Field, ObjectType, Int, registerEnumType } from "type-graphql";
import { Categories } from "../entities/Categories";
import { CardAuthorization } from "../entities/CardAuthorization";
import { CallType, ContentType, Currency, DayOfTheWeek, PlatformOptions, SignInMethod } from "../types";
import { REQUEST_MAX_RATE, REQUEST_MIN_RATE } from "../constants";

registerEnumType(CallType, {
  name: "CallType",
  description: "Type of video call to be made",
});

registerEnumType(DayOfTheWeek, {
  name: "DayOfTheWeek",
  description: "Enum representing each day of the week",
});

registerEnumType(PlatformOptions, {
  name: "PlatformOptions",
  description: "Enum representing possible device platforms",
});

registerEnumType(SignInMethod, {
  name: "SignInMethod",
  description: "Enum representing possible SignInMethods",
});
registerEnumType(Currency, {
  name: "Currency",
  description: "Enum representing possible Currencies",
});

@InputType()
export class UserInputs {
  @Length(2, 20, {
    message: "$property field should be between $constraint1 and $constraint2 characters inclusive in length",
  })
  @Field()
  displayName: string;

  @Length(8, 16, {
    message: "$property should be between $constraint1 and $constraint2 characters inclusive in length",
  })
  @Field()
  password!: string;
}

@InputType()
export class CelebrityApplicationInputs {
  @Length(2, 20, {
    message: "$property should be between $constraint1 and $constraint2 characters inclusive in length",
  })
  @Field()
  alias: string;

  @Length(2, 20, {
    message: "$property should be between $constraint1 and $constraint2 characters inclusive in length",
  })
  @Field({ nullable: true })
  twitter?: string;

  @Length(2, 20, {
    message: "$property should be between $constraint1 and $constraint2 characters inclusive in length",
  })
  @Field({ nullable: true })
  instagram?: string;

  @Length(2, 20, {
    message: "$property should be between $constraint1 and $constraint2 characters inclusive in length",
  })
  @Field({ nullable: true })
  facebook?: string;

  @IsPhoneNumber()
  @Field({ nullable: true })
  phoneNumber?: string;
}

@InputType()
export class RegisterCelebrityInputs {
  @Field()
  acceptsShoutout: boolean;

  @Field()
  acceptsInstantShoutout: boolean;

  @Field()
  acceptsCallTypeA: boolean;

  @Field()
  acceptsCallTypeB: boolean;

  @Min(REQUEST_MIN_RATE, { message: "Shoutout rate must be more than $constraint1" })
  @Max(REQUEST_MAX_RATE, { message: "Shoutout rate must not be less than $constraint1" })
  @Field(() => Int)
  shoutout: number;

  @Min(REQUEST_MIN_RATE, { message: "Call rate must be more than $constraint1" })
  @Max(REQUEST_MAX_RATE, { message: "Call rate must not be less than $constraint1" })
  @Field(() => Int)
  callTypeA: number;

  @Min(REQUEST_MIN_RATE, { message: "Call rate must be more than $constraint1" })
  @Max(REQUEST_MAX_RATE, { message: "Call rate must not be less than $constraint1" })
  @Field(() => Int)
  callTypeB: number;

  @Length(10, 50, {
    message: "$property should be between $constraint1 and $constraint2 characters inclusive in length",
  })
  @Field()
  description: string;

  isNew: boolean;

  profileHash: string;
  userId: string | undefined;
}
@InputType()
export class UpdateCelebrityInputs {
  @Length(2, 20, {
    message: "$property should be between $constraint1 and $constraint2 characters inclusive in length",
  })
  @Field({ nullable: true })
  alias: string;

  @Field({ nullable: true })
  acceptsShoutout: boolean;

  @Field({ nullable: true })
  acceptsInstantShoutout: boolean;

  @Field({ nullable: true })
  acceptsCallTypeA: boolean;

  @Field({ nullable: true })
  acceptsCallTypeB: boolean;

  @Min(REQUEST_MIN_RATE, { message: "Shoutout rate must be more than $constraint1" })
  @Max(REQUEST_MAX_RATE, { message: "Shoutout rate must not be less than $constraint1" })
  @Field(() => Int, { nullable: true })
  shoutout: number;

  @Min(REQUEST_MIN_RATE, { message: "Call rate must be more than $constraint1" })
  @Max(REQUEST_MAX_RATE, { message: "Call rate must not be less than $constraint1" })
  @Field(() => Int, { nullable: true })
  callTypeA: number;

  @Min(REQUEST_MIN_RATE, { message: "Call rate must be more than $constraint1" })
  @Max(REQUEST_MAX_RATE, { message: "Call rate must not be less than $constraint1" })
  @Field(() => Int, { nullable: true })
  callTypeB: number;

  @Length(10, 50, {
    message: "$property should be between $constraint1 and $constraint2 characters inclusive in length",
  })
  @Field({ nullable: true })
  description: string;

  profileHash: string;
  userId: string | undefined;
}

@InputType()
export class UserInputsLogin {
  @Field()
  password: string;
  @IsEmail()
  @Field()
  email: string;
}

@InputType()
export class deviceInfo {
  @Field()
  id: string;

  @Field(() => PlatformOptions)
  platform: PlatformOptions;

  @Field()
  notificationToken: string;

  @Field({ nullable: true })
  pushkitToken?: string;
}

@InputType()
export class ShoutoutRequestInput {
  @Field(() => Int)
  celebId: number;
  @Length(15, 250, {
    message: "$property field should be between $constraint1 and $constraint2 characters inclusive in length",
  })
  @Field()
  description: string;
  @Field({ defaultValue: false })
  instantShoutout: boolean;
  @IsDate()
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

  @IsDate()
  @Field()
  startTime: Date;

  @IsDate()
  @Field()
  endTime: Date;
}
@InputType()
export class ImageUploadInput {
  @Field(() => Boolean, { defaultValue: false })
  image: DayOfTheWeek;

  @Field(() => Boolean, { defaultValue: false })
  thumbnail: DayOfTheWeek;
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
export class NewCardVerificationResponse {
  @Field(() => Boolean)
  status: boolean;

  @Field()
  ref: string;

  @Field()
  message?: string;

  userId: string;
}

@ObjectType()
export class VideoCallEvent {
  @Field()
  RoomSid: string;

  @Field()
  RoomName: string;

  @Field()
  RoomStatus: string;

  @Field({ nullable: true })
  ParticipantStatus?: string;

  @Field({ nullable: true })
  ParticipantIdentity?: string;

  @Field()
  CallDuration?: number;

  participantA?: string;

  participantB?: string;

  ParticipantDuration?: string;

  @Field()
  StatusCallbackEvent: string;
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
export class ImageUploadMetadata {
  @Field()
  userId: string;

  @Field({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  image?: string;
}
@ObjectType()
export class ImageUploadLinks {
  id: string;

  @Field()
  type: "image" | "thumbnail";

  @Field()
  signedUrl: string;
}

@ObjectType()
export class ImageUpload {
  @Field(() => [ImageUploadLinks])
  urls: ImageUploadLinks[];

  @Field()
  metadataUrl: string;

  @Field(() => ImageUploadMetadata)
  metadata: ImageUploadMetadata;
}
@ObjectType()
export class ImageUploadResponse {
  @Field(() => ImageUpload, { nullable: true })
  data?: ImageUpload;

  @Field({ nullable: true })
  errorMessage?: string;
}

@ObjectType()
export class Extras {
  @Field()
  bannerMain: string;

  @Field()
  bannerSecondary: string;

  @Field()
  bannerDescription: string;

  @Field()
  instantShoutoutRate: number;
}
