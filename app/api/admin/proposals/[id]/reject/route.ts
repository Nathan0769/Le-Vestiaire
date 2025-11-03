import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error, session } = await requirePermission({ proposal: ["reject"] });
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const proposal = await prisma.jerseyProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposition non trouvée" },
        { status: 404 }
      );
    }

    const imageUrl = proposal.imageUrl;
    const imagePath = imageUrl.split("/jersey-proposals/")[1];

    await prisma.$transaction(async (tx) => {
      await tx.contributionHistory.create({
        data: {
          userId: proposal.userId,
          jerseyId: null,
          action: "REJECTED",
        },
      });

      await tx.jerseyProposal.delete({
        where: { id },
      });
    });

    if (imagePath) {
      const { error: deleteError } = await supabaseAdmin.storage
        .from("jersey-proposals")
        .remove([imagePath]);

      if (deleteError) {
        console.error(
          "Erreur suppression image du bucket jersey-proposals:",
          deleteError
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Proposition rejetée",
    });
  } catch (err) {
    console.error("❌ Erreur lors du rejet de la proposition:", err);
    return NextResponse.json(
      { error: "Erreur lors du rejet de la proposition" },
      { status: 500 }
    );
  }
}
