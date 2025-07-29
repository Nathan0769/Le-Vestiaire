import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";

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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier reçu" },
        { status: 400 }
      );
    }

    const filePath = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatar")
      .upload(filePath, file, { upsert: true });

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
