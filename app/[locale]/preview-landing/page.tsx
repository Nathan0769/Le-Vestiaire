import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";
import { LandingHero } from "@/components/home/landing/landing-hero";
import { HowItWorks } from "@/components/home/landing/how-it-works";
import { FinalCta } from "@/components/home/landing/final-cta";
import { StatsSection } from "@/components/home/stats-section";
import { TopRatedSection } from "@/components/home/top-rated-section";
import { RecentSection } from "@/components/home/recent-section";
import { FeaturesSection } from "@/components/home/features-section";
import { FAQSection } from "@/components/home/faq-section";
import { SupportSection } from "@/components/home/support-section";

export const dynamic = "force-dynamic";

// Page de preview de la nouvelle landing orientée conversion.
// Ne pas indexer : c'est un brouillon avant intégration dans la homepage.
export const metadata: Metadata = {
  title: "Preview landing — Le Vestiaire",
  robots: { index: false, follow: false },
};

async function getGlobalStats() {
  const [userCount, jerseyCount, clubCount] = await Promise.all([
    prisma.user.count(),
    prisma.jersey.count(),
    prisma.club.count(),
  ]);
  return { userCount, jerseyCount, clubCount };
}

// Posts façon Instagram pour le hero : items de collection réels, en priorisant
// ceux qui ont un flocage (nom/numéro floqué).
async function getHeroPosts() {
  const items = await prisma.userJersey.findMany({
    where: { jersey: { imageUrl: { not: "" } } },
    select: {
      playerName: true,
      playerNumber: true,
      jersey: {
        select: {
          imageUrl: true,
          season: true,
          brand: true,
          club: { select: { name: true } },
        },
      },
      user: { select: { username: true, avatar: true } },
    },
    orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
    take: 24,
  });

  const withFlocage = (i: (typeof items)[number]) =>
    i.playerName || i.playerNumber != null ? 1 : 0;
  const picked = [...items]
    .sort((a, b) => withFlocage(b) - withFlocage(a))
    .slice(0, 3);

  return Promise.all(
    picked.map(async (it) => {
      let avatarUrl: string | null = null;
      if (AVATARS_BUCKET && it.user.avatar) {
        try {
          avatarUrl = await getR2PresignedUrl(
            AVATARS_BUCKET,
            it.user.avatar,
            60 * 60
          );
        } catch {
          avatarUrl = null;
        }
      }
      const flocage =
        it.playerName || it.playerNumber != null
          ? `${it.playerName ?? ""}${
              it.playerNumber != null ? ` ${it.playerNumber}` : ""
            }`.trim()
          : null;

      return {
        imageUrl: it.jersey.imageUrl,
        club: it.jersey.club.name,
        season: it.jersey.season,
        brand: it.jersey.brand,
        username: it.user.username,
        avatarUrl,
        flocage,
      };
    })
  );
}

export default async function PreviewLandingPage() {
  const [{ userCount, jerseyCount, clubCount }, heroPosts] = await Promise.all([
    getGlobalStats(),
    getHeroPosts(),
  ]);

  return (
    <div className="min-h-screen">
      <LandingHero
        jerseyCount={jerseyCount}
        clubCount={clubCount}
        userCount={userCount}
        posts={heroPosts}
      />
      <StatsSection
        userCount={userCount}
        jerseyCount={jerseyCount}
        clubCount={clubCount}
      />
      <HowItWorks />
      <TopRatedSection />
      <RecentSection />
      <FeaturesSection />
      <FinalCta />
      <FAQSection />
      <SupportSection />
    </div>
  );
}
