import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

const R2_ENDPOINT = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export function buildDocumentStorageKey(input: {
  userId: string;
  fileName: string;
}) {
  const safeFileName = input.fileName
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");
  return `documents/${input.userId}/${randomUUID()}-${safeFileName}`;
}

export async function uploadBufferToR2(input: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );

  return {
    bucket: env.R2_BUCKET_NAME,
    key: input.key,
    storageProvider: "cloudflare-r2" as const,
    publicUrl: env.R2_PUBLIC_BASE_URL
      ? `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${input.key}`
      : null,
  };
}
