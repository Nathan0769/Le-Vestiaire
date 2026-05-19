import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

if (!process.env.CLOUDFLARE_R2_ACCOUNT_ID) {
  throw new Error("CLOUDFLARE_R2_ACCOUNT_ID is not defined");
}
if (!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) {
  throw new Error("CLOUDFLARE_R2_ACCESS_KEY_ID is not defined");
}
if (!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
  throw new Error("CLOUDFLARE_R2_SECRET_ACCESS_KEY is not defined");
}
if (!process.env.CLOUDFLARE_R2_PUBLIC_URL) {
  throw new Error("CLOUDFLARE_R2_PUBLIC_URL is not defined");
}
if (!process.env.CLOUDFLARE_R2_CLUBS_PUBLIC_URL) {
  throw new Error("CLOUDFLARE_R2_CLUBS_PUBLIC_URL is not defined");
}
if (!process.env.CLOUDFLARE_R2_LEAGUES_PUBLIC_URL) {
  throw new Error("CLOUDFLARE_R2_LEAGUES_PUBLIC_URL is not defined");
}
if (!process.env.CLOUDFLARE_R2_AVATARS_BUCKET) {
  throw new Error("CLOUDFLARE_R2_AVATARS_BUCKET is not defined");
}
if (!process.env.CLOUDFLARE_R2_USER_JERSEY_PHOTOS_BUCKET) {
  throw new Error("CLOUDFLARE_R2_USER_JERSEY_PHOTOS_BUCKET is not defined");
}
if (!process.env.CLOUDFLARE_R2_JERSEY_PROPOSALS_BUCKET) {
  throw new Error("CLOUDFLARE_R2_JERSEY_PROPOSALS_BUCKET is not defined");
}
if (!process.env.CLOUDFLARE_R2_JERSEY_PROPOSALS_PUBLIC_URL) {
  throw new Error("CLOUDFLARE_R2_JERSEY_PROPOSALS_PUBLIC_URL is not defined");
}

export const AVATARS_BUCKET = process.env.CLOUDFLARE_R2_AVATARS_BUCKET;
export const USER_JERSEY_PHOTOS_BUCKET = process.env.CLOUDFLARE_R2_USER_JERSEY_PHOTOS_BUCKET;
export const JERSEY_PROPOSALS_BUCKET = process.env.CLOUDFLARE_R2_JERSEY_PROPOSALS_BUCKET;

const JERSEY_PROPOSALS_PUBLIC_URL = process.env.CLOUDFLARE_R2_JERSEY_PROPOSALS_PUBLIC_URL;

const R2_PUBLIC_URLS: Record<string, string> = {
  jerseys: process.env.CLOUDFLARE_R2_PUBLIC_URL,
  clubs: process.env.CLOUDFLARE_R2_CLUBS_PUBLIC_URL,
  leagues: process.env.CLOUDFLARE_R2_LEAGUES_PUBLIC_URL,
  [process.env.CLOUDFLARE_R2_JERSEY_PROPOSALS_BUCKET]: JERSEY_PROPOSALS_PUBLIC_URL,
  ...(process.env.CLOUDFLARE_R2_GUIDES_PUBLIC_URL && {
    guides: process.env.CLOUDFLARE_R2_GUIDES_PUBLIC_URL,
  }),
};

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export async function uploadToR2(
  bucket: string,
  path: string,
  body: Buffer | Blob | ArrayBuffer,
  contentType: string
): Promise<void> {
  let buffer: Buffer;
  if (body instanceof Buffer) {
    buffer = body;
  } else if (body instanceof Blob) {
    buffer = Buffer.from(new Uint8Array(await body.arrayBuffer()));
  } else {
    buffer = Buffer.from(new Uint8Array(body));
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: path,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

export async function deleteFromR2(
  bucket: string,
  path: string
): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: path,
    })
  );
}

export async function downloadFromR2(
  bucket: string,
  path: string
): Promise<Buffer> {
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: path,
    })
  );

  if (!response.Body) {
    throw new Error(`Fichier introuvable : ${path}`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function getR2PublicUrl(bucket: string, path: string): string {
  const baseUrl = R2_PUBLIC_URLS[bucket]?.replace(/\/$/, "");
  if (!baseUrl) throw new Error(`No public URL configured for R2 bucket: ${bucket}`);
  return `${baseUrl}/${path}`;
}

export async function getR2PresignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: path });
  // pnpm duplique @smithy/types (4.13.1 + 4.14.2), incompatibilité de types spurious
  return (getSignedUrl as unknown as (c: unknown, cmd: unknown, o: unknown) => Promise<string>)(r2Client, command, { expiresIn });
}
