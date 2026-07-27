import { cn } from "@/lib/utils";

interface MembershipCardProps {
  name: string;
  userId: string;
  jerseyCount?: number;
  since: number;
  className?: string;
}

/** Numéro de membre stable, dérivé de l'id (flavor, pas d'identité réelle). */
function memberNumber(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return String(h % 10000).padStart(4, "0");
}

/**
 * Carte de membre du Cercle Supporter — pièce cosmétique maîtresse.
 * Automatique pour tout supporter actif ; matériaux définis dans globals.css.
 */
export function MembershipCard({
  name,
  userId,
  jerseyCount,
  since,
  className,
}: MembershipCardProps) {
  return (
    <div className={cn("w-full max-w-[420px]", className)}>
      <div className="cos-card flex flex-col justify-between p-6">
        <div className="relative z-[2] flex items-start justify-between">
          <svg
            className="h-11 w-11"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="mc-crest" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7A5F22" />
                <stop offset=".5" stopColor="#F4E6B0" />
                <stop offset="1" stopColor="#C9A84C" />
              </linearGradient>
            </defs>
            <path
              d="M24 3l16 5v11c0 11-7 18-16 23-9-5-16-12-16-23V8l16-5z"
              fill="none"
              stroke="url(#mc-crest)"
              strokeWidth="1.5"
            />
            <path
              d="M24 12v20M15 19l9 5 9-5"
              stroke="url(#mc-crest)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="24" cy="24" r="2.4" fill="url(#mc-crest)" />
          </svg>
          <div className="text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.24em] text-[#F4E6B0]">
            Membre
            <br />
            Supporter
          </div>
        </div>

        <div className="relative z-[2]">
          <p className="cos-gold-text font-serif text-[28px] italic leading-none">
            Cercle Supporter
          </p>
        </div>

        <div className="relative z-[2] flex items-end justify-between">
          <div>
            <div className="font-serif text-lg tracking-wide">{name}</div>
            <div className="mt-1 font-mono text-[11px] tracking-[0.16em] text-[#F3EEDF]/60">
              N° {memberNumber(userId)}
              {jerseyCount != null && ` · ${jerseyCount} maillots`}
            </div>
          </div>
          <div className="text-right font-mono text-[10px] uppercase tracking-[0.14em] text-[#F3EEDF]/55">
            Membre depuis
            <span className="mt-0.5 block text-[15px] tracking-[0.06em] text-[#F4E6B0]">
              {since}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
