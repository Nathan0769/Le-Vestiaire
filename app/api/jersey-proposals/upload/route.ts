import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";
import { validateImageFile, MAX_FILE_SIZE } from "@/lib/file-validation";
import {
  proposalsRateLimit,
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

    if (
      !user.role ||
      !["contributor", "admin", "superadmin"].includes(user.role)
    ) {
      return NextResponse.json(
        { error: "Vous devez être contributeur pour proposer des maillots" },
        { status: 403 }
      );
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(proposalsRateLimit, identifier);

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
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const extension = validation.detectedType?.split("/")[1] || "jpg";
    const timestamp = Date.now();
    const filePath = `${user.id}/${timestamp}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("jersey-proposals")
      .upload(filePath, file, {
        upsert: true,
        contentType: validation.detectedType,
      });

    if (uploadError) {
      console.error("Erreur upload Supabase:", uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage
      .from("jersey-proposals")
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: data.publicUrl,
      path: filePath,
    });
  } catch (err) {
    console.error("Erreur API jersey proposal upload:", err);
    return NextResponse.json(
      { error: "Erreur interne serveur" },
      { status: 500 }
    );
  }
}
