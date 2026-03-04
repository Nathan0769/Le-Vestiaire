import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

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

export function getR2PublicUrl(path: string): string {
  const baseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!.replace(/\/$/, "");
  return `${baseUrl}/${path}`;
}
