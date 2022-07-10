import crypto from "crypto";
import dayjs from "dayjs";
import { s3primaryClient } from "../../services/aws/clients/s3Client";
import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { AppContext } from "../../types";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isAuthenticated } from "../../middleware/isAuthenticated";
import { S3SignedObject } from "../../utils/graphqlTypes";

@Resolver()
export class PublicMediaResolver {
  bucketName = process.env.AWS_PUBLIC_BUCKET_NAME;

  @Query(() => S3SignedObject)
  @UseMiddleware(isAuthenticated)
  async getPublicFileUploadUrl(
    @Arg("isHomeThumbnail") isHomeThumbnail: boolean,
    @Ctx() { req }: AppContext
  ): Promise<S3SignedObject> {
    const userId = req.session.userId;
    const randomNumber = Math.random().toString();
    const datetime = dayjs().format("DD-MM-YYYY");
    const fileId = crypto
      .createHash("md5")
      .update(datetime + randomNumber)
      .digest("hex");
    let type = "profile_main_image";
    if (isHomeThumbnail) {
      type = "thumbnail";
    }
    const Key = `${userId}/${type}/${datetime}-${fileId}`;
    const s3Command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key,
    });
    const signedUrl = await getSignedUrl(s3primaryClient, s3Command, {
      expiresIn: 60,
    });

    return { signedUrl, fileName: Key };
  }

  @Query(() => S3SignedObject)
  @UseMiddleware(isAuthenticated)
  async getPublicFileDeleteUrl(@Arg("key") key: string): Promise<S3SignedObject> {
    const s3Command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const signedUrl = await getSignedUrl(s3primaryClient, s3Command, {
      expiresIn: 60,
    });
    return { signedUrl };
  }
}
