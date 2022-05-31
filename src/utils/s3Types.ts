import { Field, InputType, ObjectType } from "type-graphql";

@InputType()
export class FilemetaData {
  @Field()
  fileName: string;

  @Field()
  fileType: string;
}

@ObjectType()
export class s3SignedObject {
  @Field()
  signedUrl: string;

  @Field({ nullable: true })
  fileName?: string;
}
