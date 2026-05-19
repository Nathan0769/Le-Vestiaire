import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { validateImageFile, MAX_FILE_SIZE } from "@/lib/file-validation";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { uploadToR2, getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Trop de uploads. Réessayez plus tard.",
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier reçu" },
        { status: 400 }
      );
    }

    const validation = await validateImageFile(file, MAX_FILE_SIZE);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const extension = validation.detectedType?.split("/")[1] || "jpg";
    const filePath = `${user.id}/${Date.now()}.${extension}`;

    await uploadToR2(AVATARS_BUCKET, filePath, await file.arrayBuffer(), validation.detectedType!);

    const url = await getR2PresignedUrl(AVATARS_BUCKET, filePath, 60 * 60);

    return NextResponse.json({ url, path: filePath });
  } catch (err) {
    console.error("Erreur API avatar upload:", err);
    return NextResponse.json(
      { error: "Erreur interne serveur" },
      { status: 500 }
    );
  }
}
