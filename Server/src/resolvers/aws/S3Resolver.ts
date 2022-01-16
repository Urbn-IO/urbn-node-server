import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FilemetaData, PutSignedObject } from "../../utils/s3Types";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { isAuth } from "../../middleware/isAuth";
import { AppContext } from "../../types";
import { exec } from "shelljs";
import path from "path";
import dayjs from "dayjs";

@Resolver()
export class S3Resolver {
  bucketName = process.env.AWS_BUCKET_NAME;
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

  @Mutation(() => PutSignedObject)
  @UseMiddleware(isAuth)
  async signFileToS3(
    @Arg("metaData") metaData: FilemetaData,
    @Ctx() { req }: AppContext
  ): Promise<PutSignedObject> {
    const datetime = dayjs().format("DD-MM-YYYY");
    const sanitizedFileName = metaData.fileName
      .trim()
      .replace(/[^a-zA-Z0-9.]/g, "-");
    const Key = `${req.session.userId}/${datetime}-${sanitizedFileName}`;

    const s3Command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key,
      ContentType: metaData.fileType,
    });

    const signedUrl = await getSignedUrl(this.s3, s3Command, {
      expiresIn: 900,
    });
    return { signedUrl, fileName: Key };
  }

  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async deleteSignedFileFromS3(@Arg("key") key: string): Promise<string> {
    const s3Command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const signedUrl = await getSignedUrl(this.s3, s3Command, {
      expiresIn: 60,
    });
    return signedUrl;
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  async getSignedFileFromS3(@Arg("key") fileName: string): Promise<string> {
    const time = dayjs().add(60, "second").unix();
    const keyPairId = process.env.AWS_CLOUD_FRONT_KEY_PAIR_ID;
    const pathToPrivateKey = path.join(
      __dirname,
      "/../../../Keys/private_key.pem"
    );
    const signedUrl = exec(
      `aws cloudfront sign --url ${process.env.AWS_CLOUD_FRONT_DOMAIN}/${fileName} --key-pair-id ${keyPairId} --private-key file://${pathToPrivateKey} --date-less-than ${time}`
    );

    return signedUrl;
  }
}
