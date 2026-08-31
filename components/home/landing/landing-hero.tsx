import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { ArrowRight, Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { hankenGrotesk } from "./landing-fonts";

interface HeroPost {
  imageUrl: string;
  club: string;
  season: string;
  brand: string | null;
  username: string;
  avatarUrl: string | null;
  flocage: string | null;
}

interface LandingHeroProps {
  jerseyCount: number;
  clubCount: number;
  userCount: number;
  posts: HeroPost[];
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

// Positions des 3 cartes empilées (rotation + z-index), du fond vers l'avant.
const CARD_POS = [
  "left-[-30px] top-[120px] -rotate-6 z-[1]",
  "right-[-6px] top-1 rotate-6 z-[2]",
  "left-[70px] top-[70px] -rotate-3 z-[3]",
];

export function LandingHero({
  jerseyCount,
  clubCount,
  userCount,
  posts,
}: LandingHeroProps) {
  return (
    <section
      className={`${hankenGrotesk.variable} relative overflow-hidden bg-gradient-to-b from-primary/[0.07] via-background to-background pt-14 pb-20 md:pt-16 md:pb-24`}
      style={{ fontFamily: "var(--font-hanken)" }}
      aria-label="Présentation de Le Vestiaire"
    >
      {/* Fond : terrain vu du dessus, discret et adapté au thème */}
      <svg
        className="absolute inset-0 h-full w-full text-primary opacity-[0.12] dark:opacity-[0.18]"
        viewBox="0 0 1050 680"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden="true"
      >
        <rect x="15" y="15" width="1020" height="650" />
        <line x1="525" y1="15" x2="525" y2="665" />
        <circle cx="525" cy="340" r="92" />
        <circle cx="525" cy="340" r="3.5" fill="currentColor" stroke="none" />
        <rect x="15" y="138" width="165" height="404" />
        <rect x="15" y="249" width="55" height="182" />
        <circle cx="125" cy="340" r="3.5" fill="currentColor" stroke="none" />
        <path d="M180 266 A 92 92 0 0 1 180 414" />
        <rect x="870" y="138" width="165" height="404" />
        <rect x="980" y="249" width="55" height="182" />
        <circle cx="925" cy="340" r="3.5" fill="currentColor" stroke="none" />
        <path d="M870 266 A 92 92 0 0 0 870 414" />
        <path d="M15 27 A 12 12 0 0 1 27 15" />
        <path d="M1023 15 A 12 12 0 0 1 1035 27" />
        <path d="M27 665 A 12 12 0 0 1 15 653" />
        <path d="M1035 653 A 12 12 0 0 1 1023 665" />
      </svg>
      {/* Halos colorés pour casser le fond blanc */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(720px 420px at 88% -8%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 58%), radial-gradient(620px 420px at -6% 112%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 px-6 md:grid-cols-2 md:gap-14">
        {/* Colonne texte */}
        <div className="md:pt-6">
          <span className="mb-6 inline-flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            {fmt(jerseyCount)} maillots déjà répertoriés
          </span>

          <h1 className="text-[2.6rem] font-black leading-[1.02] tracking-tight text-foreground sm:text-6xl">
            Range ta collection.
            <br />
            Découvre <span className="text-primary">le vestiaire</span> des
            autres.
          </h1>

          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Cataloguez vos maillots, suivez leur valeur et comparez votre
            collection à celle de plus de {fmt(userCount)} passionnés.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild className="gap-2">
              <Link href="/auth/signUp">
                Créer un compte
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/jerseys">Découvrir le catalogue</Link>
            </Button>
          </div>

          <Link
            href="/auth/login"
            className="mt-5 inline-block text-sm font-medium text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            J&apos;ai déjà un compte
          </Link>

          <div className="my-6 h-px max-w-lg bg-border" />

          <div className="flex flex-wrap items-center gap-3.5 text-base text-muted-foreground">
            <span>
              <b className="font-extrabold tabular-nums text-foreground">
                {fmt(userCount)}
              </b>{" "}
              collectionneurs
            </span>
            <span className="text-border" aria-hidden="true">
              /
            </span>
            <span>
              <b className="font-extrabold tabular-nums text-foreground">
                {fmt(jerseyCount)}
              </b>{" "}
              maillots
            </span>
            <span className="text-border" aria-hidden="true">
              /
            </span>
            <span>
              <b className="font-extrabold tabular-nums text-foreground">
                {fmt(clubCount)}
              </b>{" "}
              clubs
            </span>
          </div>
        </div>

        {/* Colonne visuelle : posts façon Instagram (décoratif) */}
        <div className="relative hidden h-[440px] md:block" aria-hidden="true">
          {posts.slice(0, 3).map((post, i) => (
            <PostCard
              key={`${post.username}-${post.club}-${i}`}
              post={post}
              className={CARD_POS[i]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PostCard({
  post,
  className = "",
}: {
  post: HeroPost;
  className?: string;
}) {
  const initial = post.username?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div
      className={`absolute w-[224px] overflow-hidden rounded-2xl border border-border bg-card shadow-xl ${className}`}
    >
      {/* Header façon Instagram */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {post.avatarUrl ? (
          <Image
            src={post.avatarUrl}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
            {initial}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
          {post.username}
        </span>
        <MoreHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      {/* Image */}
      <div className="relative flex h-[168px] items-center justify-center bg-white p-3">
        {post.flocage && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-black/70 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
            {post.flocage}
          </span>
        )}
        <Image
          src={post.imageUrl}
          alt=""
          width={200}
          height={200}
          className="h-full w-full object-contain"
        />
      </div>

      {/* Footer façon Instagram */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-3 text-foreground">
          <Heart className="h-4 w-4" />
          <MessageCircle className="h-4 w-4" />
        </div>
        <div className="mt-2 truncate text-xs">
          <span className="font-semibold text-foreground">{post.club}</span>
          <span className="text-muted-foreground">
            {" · "}
            {post.season}
            {post.brand ? ` · ${post.brand}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
