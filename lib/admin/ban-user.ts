import prisma from "@/lib/prisma";
import {
  deleteFromR2,
  USER_JERSEY_PHOTOS_BUCKET,
  AVATARS_BUCKET,
} from "@/lib/r2-storage";

/**
 * Bannit un compte : bloque la connexion (champ `banned` lu par le plugin
 * admin Better Auth), coupe ses sessions web et iOS, masque ses posts et
 * retire toutes ses images. Les images sont supprimées sans attendre une
 * revue : le ban sert d'abord à faire disparaître un contenu illicite.
 */
export async function banUser(userId: string, reason: string) {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      avatar: true,
      collection: { select: { userPhotoUrls: true } },
    },
  });
  if (!target) throw new Error("USER_NOT_FOUND");

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { banned: true, banReason: reason, banExpiresIn: null, avatar: null },
    });
    await tx.userJersey.updateMany({
      where: { userId },
      data: { userPhotoUrls: [] },
    });
    const posts = await tx.post.updateMany({
      where: { authorId: userId, deletedAt: null },
      data: { deletedAt: now },
    });
    const sessions = await tx.session.deleteMany({ where: { userId } });
    return { posts: posts.count, sessions: sessions.count };
  });

  // Après le commit : un fichier R2 orphelin vaut mieux qu'une URL en base
  // qui pointe vers une image supprimée.
  const files: [string, string][] = [
    ...target.collection.flatMap((item) =>
      item.userPhotoUrls.map((path): [string, string] => [USER_JERSEY_PHOTOS_BUCKET, path])
    ),
    ...(target.avatar ? [[AVATARS_BUCKET, target.avatar] as [string, string]] : []),
  ];
  let photosFailed = 0;
  for (const [bucket, path] of files) {
    try {
      await deleteFromR2(bucket, path);
    } catch (err) {
      photosFailed++;
      console.error("Erreur suppression image (ban):", err);
    }
  }

  return { ...result, photos: files.length - photosFailed, photosFailed };
}

export async function unbanUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { banned: false, banReason: null, banExpiresIn: null },
  });
}
