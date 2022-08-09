import { User } from "../entities/User";
import { InputType, Field, ObjectType, Int, registerEnumType } from "type-graphql";
import { Categories } from "../entities/Categories";
import { CardAuthorization } from "../entities/CardAuthorization";
import { CallType, ContentType, DayOfTheWeek, NotificationRouteCode, PlatformOptions } from "../types";

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

//remove this, its for testing
registerEnumType(NotificationRouteCode, {
  name: "NotificationRouteCode",
  description: "Enum representing possible NotificationRouteCode",
});

@InputType()
export class UserInputs {
  @Field()
  firstName: string;
  @Field()
  lastName: string;
  @Field()
  password!: string;
  @Field()
  dateOfBirth: Date;
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
  shoutoutRates: string;
  @Field()
  callRatesA: string;
  @Field()
  callRatesB: string;
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
  shoutoutRates: string;
  @Field({ nullable: true })
  thumbnail: string;
  @Field({ nullable: true })
  callRatesA: string;
  @Field({ nullable: true })
  callRatesB: string;
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

///remove below after
@InputType()
export class TestData {
  @Field(() => NotificationRouteCode)
  routeCode: NotificationRouteCode;
}

@InputType()
export class NotificationsPayloadTest {
  @Field({ nullable: true })
  messageTitle?: string;
  @Field({ nullable: true })
  messageBody?: string;
  @Field(() => [String])
  tokens: string[];
  @Field({ nullable: true })
  data?: TestData;
}
