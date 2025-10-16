import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: user.id, status: "ACCEPTED" },
          { receiverId: user.id, status: "ACCEPTED" },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
            favoriteClubId: true,
            favoriteClub: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
            favoriteClubId: true,
            favoriteClub: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const friends = await Promise.all(
      friendships.map(async (friendship) => {
        const friend =
          friendship.senderId === user.id
            ? friendship.receiver
            : friendship.sender;

        let avatarUrl = null;
        if (friend.avatar) {
          const { data } = await supabaseAdmin.storage
            .from("avatar")
            .createSignedUrl(friend.avatar, 60 * 60);
          avatarUrl = data?.signedUrl || null;
        }

        return {
          id: friendship.id,
          senderId: friendship.senderId,
          receiverId: friendship.receiverId,
          status: friendship.status,
          createdAt: friendship.createdAt.toISOString(),
          updatedAt: friendship.updatedAt.toISOString(),
          user: {
            id: friend.id,
            username: friend.username,
            name: friend.name,
            avatar: friend.avatar,
            avatarUrl,
            bio: friend.bio,
            favoriteClub: friend.favoriteClub || null,
          },
        };
      })
    );

    return NextResponse.json({ friends });
  } catch (error) {
    console.error("Erreur GET friends:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { receiverId } = await request.json();

    if (!receiverId) {
      return NextResponse.json(
        { error: "ID du destinataire manquant" },
        { status: 400 }
      );
    }

    if (receiverId === user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous ajouter vous-même" },
        { status: 400 }
      );
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const blocked = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId, status: "BLOCKED" },
          { senderId: receiverId, receiverId: user.id, status: "BLOCKED" },
        ],
      },
    });

    if (blocked) {
      return NextResponse.json(
        { error: "Impossible d'envoyer une demande" },
        { status: 403 }
      );
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId },
          { senderId: receiverId, receiverId: user.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return NextResponse.json(
          { error: "Vous êtes déjà amis" },
          { status: 400 }
        );
      }
      if (existing.status === "PENDING") {
        return NextResponse.json(
          { error: "Demande déjà en attente" },
          { status: 400 }
        );
      }
      if (existing.status === "REJECTED") {
        const updated = await prisma.friendship.update({
          where: { id: existing.id },
          data: {
            status: "PENDING",
            senderId: user.id,
            receiverId,
            updatedAt: new Date(),
          },
        });

        try {
          const channel = supabaseAdmin.channel(`friendship:${receiverId}`);
          await channel.send({
            type: "broadcast",
            event: "friendship:update",
            payload: { kind: "PENDING_CREATED", id: updated.id },
          });
          await supabaseAdmin.removeChannel(channel);
        } catch {
          // ignore realtime errors
        }

        return NextResponse.json({
          success: true,
          message: "Demande renvoyée",
          friendship: {
            id: updated.id,
            status: updated.status,
            createdAt: updated.createdAt.toISOString(),
          },
        });
      }
    }

    const friendship = await prisma.friendship.create({
      data: {
        senderId: user.id,
        receiverId,
        status: "PENDING",
      },
    });

    try {
      const channel = supabaseAdmin.channel(`friendship:${receiverId}`);
      await channel.send({
        type: "broadcast",
        event: "friendship:update",
        payload: { kind: "PENDING_CREATED", id: friendship.id },
      });
      await supabaseAdmin.removeChannel(channel);
    } catch {
      // ignore realtime errors
    }

    return NextResponse.json({
      success: true,
      message: "Demande d'ami envoyée",
      friendship: {
        id: friendship.id,
        status: friendship.status,
        createdAt: friendship.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur POST friends:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
