import { IsDate, IsEmail, IsPhoneNumber, Length, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Field, InputType, Int, ObjectType, registerEnumType } from 'type-graphql';
import { REQUEST_MAX_RATE, REQUEST_MIN_RATE } from '../constants';
import { Categories } from '../entities/Categories';
import { User } from '../entities/User';
import { CallType, ContentType, Currency, DayOfTheWeek, PlatformOptions, SignInMethod } from '../types';

registerEnumType(CallType, {
  name: 'CallType',
  description: 'Type of video call to be made',
});

registerEnumType(DayOfTheWeek, {
  name: 'DayOfTheWeek',
  description: 'Enum representing each day of the week',
});

registerEnumType(PlatformOptions, {
  name: 'PlatformOptions',
  description: 'Enum representing possible device platforms',
});

registerEnumType(SignInMethod, {
  name: 'SignInMethod',
  description: 'Enum representing possible SignInMethods',
});
registerEnumType(Currency, {
  name: 'Currency',
  description: 'Enum representing possible Currencies',
});

@InputType()
export class UserInputs {
  @Length(2, 20, {
    message: '$property field should be between $constraint1 and $constraint2 characters inclusive in length',
  })
  @Field()
  displayName: string;

  @Length(8, 16, {
    message: '$property should be between $constraint1 and $constraint2 characters inclusive in length',
  })
  @Field()
  password!: string;
}

@InputType()
export class CelebrityApplicationInputs {
  @Length(2, 20, {
    message: '$property should be between $constraint1 and $constraint2 characters inclusive in length',
  })
  @Field()
  alias: string;

  @Length(2, 20, {
    message: '$property should be between $constraint1 and $constraint2 characters inclusive in length',
  })
  @Field({ nullable: true })
  twitter?: string;

  @Length(2, 20, {
    message: '$property should be between $constraint1 and $constraint2 characters inclusive in length',
  })
  @Field({ nullable: true })
  instagram?: string;

  @Length(2, 20, {
    message: '$property should be between $constraint1 and $constraint2 characters inclusive in length',
  })
  @Field({ nullable: true })
  facebook?: string;

  @IsPhoneNumber(undefined, { message: 'Provide a valid phone number' })
  @Field({ nullable: true })
  phoneNumber?: string;
}

@InputType()
export class OnboardCelebrityInputs {
  @Field()
  acceptsShoutout: boolean;

  @Field()
  acceptsInstantShoutout: boolean;

  @Field()
  acceptsCallTypeA: boolean;

  @Field()
  acceptsCallTypeB: boolean;

  @Min(REQUEST_MIN_RATE, {
    message: 'Shoutout rate must be more than $constraint1',
  })
  @Max(REQUEST_MAX_RATE, {
    message: 'Shoutout rate must not be less than $constraint1',
  })
  @Field(() => Int)
  shoutout: number;

  instantShoutout: number;

  @Min(REQUEST_MIN_RATE, {
    message: 'Call rate must be more than $constraint1',
  })
  @Max(REQUEST_MAX_RATE, {
    message: 'Call rate must not be less than $constraint1',
  })
  @Field(() => Int, { nullable: true })
  callTypeA: number;

  @Min(REQUEST_MIN_RATE, {
    message: 'Call rate must be more than $constraint1',
  })
  @Max(REQUEST_MAX_RATE, {
    message: 'Call rate must not be less than $constraint1',
  })
  @Field(() => Int, { nullable: true })
  callTypeB: number;

  @Length(10, 50, {
    message: '$property should be between $constraint1 and $constraint2 characters inclusive in length',
  })
  @Field()
  description: string;

  @Field(() => [CallScheduleInput], { defaultValue: [] })
  callScheduleSlots?: CallScheduleInput[];

  availableTimeSlots: CallSlots[];
  isNew: boolean;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  profileHash: string;
  userId: string | undefined;
}
@InputType()
export class UpdateCelebrityInputs {
  @Length(2, 20, {
    message: '$property should be between $constraint1 and $constraint2 characters inclusive in length',
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

  @Min(REQUEST_MIN_RATE, {
    message: 'Shoutout rate must be more than $constraint1',
  })
  @Max(REQUEST_MAX_RATE, {
    message: 'Shoutout rate must not be less than $constraint1',
  })
  @Field(() => Int, { nullable: true })
  shoutout: number;

  instantShoutout: number;

  @Min(REQUEST_MIN_RATE, {
    message: 'Call rate must be more than $constraint1',
  })
  @Max(REQUEST_MAX_RATE, {
    message: 'Call rate must not be less than $constraint1',
  })
  @Field(() => Int, { nullable: true })
  callTypeA: number;

  @Min(REQUEST_MIN_RATE, {
    message: 'Call rate must be more than $constraint1',
  })
  @Max(REQUEST_MAX_RATE, {
    message: 'Call rate must not be less than $constraint1',
  })
  @Field(() => Int, { nullable: true })
  callTypeB: number;

  @Length(10, 50, {
    message: '$property should be between $constraint1 and $constraint2 characters inclusive in length',
  })
  @Field({ nullable: true })
  description: string;

  @Field(() => [CallScheduleInput], { nullable: true })
  callScheduleSlots?: CallScheduleInput[];

  availableTimeSlots: CallSlots[];

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
export class DeviceInfoInput {
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
  @Length(15, 300, {
    message: '$property field should be between $constraint1 and $constraint2 characters inclusive in length',
  })
  @Field()
  description: string;
  @Field({ defaultValue: false })
  instantShoutout: boolean;
  @IsDate()
  @Field()
  requestExpiration: Date;
  @Field({ nullable: true })
  @Length(2, 20, {
    message: '$property field should be between $constraint1 and $constraint2 characters inclusive in length',
  })
  for?: string;
}
@InputType()
export class TimeSlot {
  @Field()
  slotId: string;

  @Field(() => DayOfTheWeek)
  day: DayOfTheWeek;
}
@InputType()
export class VideoCallRequestInputs {
  @Field(() => Int)
  celebId: number;

  @Field(() => TimeSlot)
  selectedTimeSlot: TimeSlot;

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
export class AccountNumberInput {
  @Field()
  bankCode: string;

  @MinLength(10)
  @MaxLength(10)
  @Field()
  accountNumber: string;
}

@ObjectType()
export class VerifyAccountNumberResponse {
  @Field({ nullable: true })
  accountName?: string;

  @Field({ nullable: true })
  errorMessage?: string;
}

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
export class RequestResponse {
  @Field(() => String, { nullable: true })
  authUrl?: string;

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
export class S3SignedObject {
  @Field()
  signedUrl: string;

  @Field({ nullable: true })
  fileName?: string;
}

@ObjectType()
export class CallTokenResponse {
  @Field(() => String, { nullable: true })
  token?: string;

  @Field(() => String, { nullable: true })
  roomName?: string;

  user?: string;

  @Field({ nullable: true })
  errorMessage?: string;
}
@ObjectType()
export class VerifyPaymentResponse {
  @Field(() => Boolean)
  status: boolean;

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
export class CustomVideoMetadata {
  @Field()
  userId: string;

  @Field()
  contentType: ContentType;

  @Field({ nullable: true })
  owner?: string;

  @Field({ nullable: true })
  alias?: string;

  @Field({ nullable: true })
  reference?: string;
}

@ObjectType()
export class VideoMetadata {
  @Field(() => String)
  srcVideo: string;

  @Field(() => CustomVideoMetadata)
  customMetadata: CustomVideoMetadata;

  @Field(() => String, { nullable: true })
  destBucket?: string;

  @Field(() => String, { nullable: true })
  jobTemplate?: string;

  @Field(() => String, { nullable: true })
  cloudFront?: string;
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
export class VideoUploadResponse {
  @Field(() => VideoData, { nullable: true })
  videoData?: VideoData;
  @Field({ nullable: true })
  errorMessage?: string;
}

@ObjectType()
export class ImageUploadMetadata {
  @Field()
  userId: string;

  @Field()
  key: string;

  @Field()
  type: 'thumbnail' | 'low_res_placeholder';
}

@ObjectType()
export class ImageUpload {
  @Field()
  url: string;

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
export class CallSlotBase {
  @Field()
  start: string;
  @Field()
  end: string;
}

@ObjectType()
export class CallSlotMin extends CallSlotBase {
  @Field()
  id: string;
  @Field()
  available: boolean;
}
@ObjectType()
export class CallSlotHrs extends CallSlotBase {
  @Field(() => [CallSlotMin])
  minSlots: CallSlotMin[];
}
@ObjectType()
export class CallSlots extends CallSlotBase {
  @Field(() => DayOfTheWeek)
  day: DayOfTheWeek;
  @Field(() => [CallSlotHrs])
  hourSlots: CallSlotHrs[];
}

@ObjectType()
export class InitiateVideoCallResponse {
  @Field(() => Int, { nullable: true })
  attempts?: number;

  @Field({ nullable: true })
  celebThumbnail?: string;

  @Field({ nullable: true })
  errorMessage?: string;
}
