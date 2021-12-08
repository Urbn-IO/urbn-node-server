import { Field, InputType } from "type-graphql";

@InputType()
export class FilemetaData {
  @Field()
  fileName: string;

  @Field()
  fileType: string;
}
