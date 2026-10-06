import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

const configured = Boolean(
  env.r2AccountId &&
  env.r2AccessKeyId &&
  env.r2SecretAccessKey &&
  env.r2BucketName &&
  env.r2PublicUrl,
);

const client = configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
      },
    })
  : undefined;

export async function uploadPostImage(data: Buffer, extension: string, contentType: string) {
  if (!client || !env.r2BucketName || !env.r2PublicUrl) {
    throw new Error("Bildspeicher ist noch nicht eingerichtet. Bitte R2 in den Server-Umgebungsvariablen konfigurieren.");
  }
  const key = `posts/${crypto.randomUUID()}.${extension}`;
  await client.send(new PutObjectCommand({
    Bucket: env.r2BucketName,
    Key: key,
    Body: data,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return `${env.r2PublicUrl.replace(/\/$/, "")}/${key}`;
}
