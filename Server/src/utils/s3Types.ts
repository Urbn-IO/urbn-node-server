import { Field, InputType, ObjectType } from "type-graphql";

@InputType()
export class FilemetaData {
  @Field()
  fileName: string;

  @Field()
  fileType: string;
}

@ObjectType()
export class PutSignedObject {
  @Field()
  signedUrl: string;

  @Field()
  fileName: string;
}
