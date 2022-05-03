import crypto from "crypto";
import { s3SignedObject } from "../../utils/s3Types";
import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { AppContext } from "../../types";
import dayjs from "dayjs";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isAuth } from "../../middleware/isAuth";

@Resolver()
export class PublicMediaResolver {
  bucketName = process.env.AWS_PUBLIC_BUCKET_NAME;
  region = process.env.AWS_BUCKET_REGION;
  accessKey = process.env.AWS_ACCESS_KEY;
  secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  s3Config: S3ClientConfig = {
    region: this.region,
    credentials: {
      accessKeyId: this.accessKey,
      secretAccessKey: this.secretAccessKey,
    },
  };
  s3 = new S3Client(this.s3Config);

  @Query(() => s3SignedObject)
  @UseMiddleware(isAuth)
  async getPublicFileUploadUrl(
    @Arg("isHomeThumbnail") isHomeThumbnail: boolean,
    @Ctx() { req }: AppContext
  ): Promise<s3SignedObject> {
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
    const signedUrl = await getSignedUrl(this.s3, s3Command, {
      expiresIn: 60,
    });

    return { signedUrl, fileName: Key };
  }

  @Query(() => s3SignedObject)
  @UseMiddleware(isAuth)
  async getPublicFileDeleteUrl(
    @Arg("key") key: string
  ): Promise<s3SignedObject> {
    const s3Command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const signedUrl = await getSignedUrl(this.s3, s3Command, {
      expiresIn: 60,
    });
    return { signedUrl };
  }
}
