import crypto from "crypto";
import path from "path";
import dayjs from "dayjs";
import fs from "fs";
import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3SignedObject } from "../../utils/s3Types";
import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { isAuth } from "../../middleware/isAuth";
import { Signer } from "../../utils/cloudFront";
import { ValidateRecipient } from "../../utils/requestValidations";
import { AppContext } from "../../types";
import { Requests } from "../../entities/Requests";

@Resolver()
export class ShoutoutResolver {
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

  @Query(() => [s3SignedObject])
  @UseMiddleware(isAuth)
  async shoutoutUploadUrl(
    @Arg("requestId") requestId: number,
    @Ctx() { req }: AppContext
  ): Promise<s3SignedObject[]> {
    const identity = req.session.userId as string;
    const datetime = dayjs().format("DD-MM-YYYY");
    const randomNumber = Math.random().toString();
    const fileId = crypto
      .createHash("md5")
      .update(datetime + randomNumber)
      .digest("hex");

    const isValidRequestRecepient = await ValidateRecipient(
      identity,
      requestId
    );
    if (isValidRequestRecepient) {
      const response: s3SignedObject[] = [];
      const request = await Requests.findOne({
        where: { id: requestId },
        select: ["requestor"],
      });
      if (request) {
        const ownedBy = request.requestor;
        const thumbnail = `${ownedBy}/shoutOutThumbnail/${datetime}-${fileId}`;
        const profileObject = `${ownedBy}/shoutOutProfileOject/${datetime}-${fileId}.mp4`;
        const keys = [thumbnail, profileObject];
        for (const Key of keys) {
          const s3Command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key,
          });

          const signedUrl = await getSignedUrl(this.s3, s3Command, {
            expiresIn: 3600,
          });
          response.push({ signedUrl, fileName: Key });
        }
        return response;
      }
    }

    return [];
  }

  @Query(() => s3SignedObject)
  @UseMiddleware(isAuth)
  async shoutoutDeleteUrl(@Arg("key") key: string): Promise<s3SignedObject> {
    const s3Command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const signedUrl = await getSignedUrl(this.s3, s3Command, {
      expiresIn: 3600,
    });
    return { signedUrl };
  }

  @Query(() => s3SignedObject)
  @UseMiddleware(isAuth)
  async shoutoutDownloadUrl(
    @Arg("key") fileName: string
  ): Promise<s3SignedObject> {
    const time = dayjs().add(3600, "second").unix();
    const keyPairId = process.env.AWS_CLOUD_FRONT_KEY_PAIR_ID;
    const pathToPrivateKey = path.join(
      __dirname,
      "/../../../keys/private_key.pem"
    );

    const privateKey = fs.readFileSync(pathToPrivateKey, "utf8");

    // const signedUrl = exec(
    //   `aws cloudfront sign --url ${process.env.AWS_CLOUD_FRONT_DOMAIN}/${fileName} --key-pair-id ${keyPairId} --private-key file://${pathToPrivateKey} --date-less-than ${time}`
    // );
    const cfSigner = new Signer(keyPairId, privateKey);
    const signedUrl = cfSigner.getSignedUrl({
      url: `${process.env.AWS_CLOUD_FRONT_DOMAIN}/${fileName}`,
      expires: time,
    });

    return { signedUrl };
  }
}
