import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";
import { validateImageFile, MAX_FILE_SIZE } from "@/lib/file-validation";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Rate limiting : 10 uploads par heure
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

    // Validation stricte du fichier avec magic bytes
    const validation = await validateImageFile(file, MAX_FILE_SIZE);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Générer un nom de fichier sécurisé basé sur le type détecté
    const extension = validation.detectedType?.split("/")[1] || "jpg";
    const filePath = `${user.id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatar")
      .upload(filePath, file, {
        upsert: true,
        contentType: validation.detectedType, // Utiliser le type détecté par magic bytes
      });

    if (uploadError) {
      console.error("Erreur upload Supabase:", uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from("avatar")
      .createSignedUrl(filePath, 60 * 60);

    if (urlError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: "Impossible de générer l'URL signée" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: signedUrlData.signedUrl,
      path: filePath,
    });
  } catch (err) {
    console.error("Erreur API avatar upload:", err);
    return NextResponse.json(
      { error: "Erreur interne serveur" },
      { status: 500 }
    );
  }
}
